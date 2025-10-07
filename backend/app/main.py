from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timedelta
import motor.motor_asyncio
from bson import ObjectId
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
import jwt
import pandas as pd
import numpy as np
from esda.moran import Moran
from app.spatial.gi_star import (
    events_to_grid,
    gi_star as gi_star_compute,
    save_as_shapefile,
)

# Load environment variables
load_dotenv()

app = FastAPI(title="Urban Near Miss Mapper API")

# CORS middleware
# CORS: explicitly allow local dev origins to avoid preflight/credentials issues
DEV_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=DEV_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\\.0\\.0\\.1)(:\\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "near_miss_db")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Ensure indexes on startup
@app.on_event("startup")
async def ensure_indexes():
    # Create 2dsphere index for location-based queries
    try:
        await db.events.create_index([("location", "2dsphere")])
    except Exception as e:
        # Log or ignore; app can still function for non-geo endpoints
        print(f"Index creation warning: {e}")
    # Credentials indexes
    try:
        await db.credentials.create_index("email_or_phone", unique=True)
        await db.credentials.create_index("role")
    except Exception as e:
        print(f"Credentials index warning: {e}")

# Helper to serialize MongoDB document to API model-friendly dict
def serialize_event(doc: dict) -> dict:
    if not doc:
        return doc
    out = dict(doc)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    return out

# Auth setup
# Use pbkdf2_sha256 to avoid external bcrypt backend issues on Windows
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_change_me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_access_token(subject: str, role: str) -> str:
    to_encode = {
        "sub": subject,
        "role": role,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

# Auth models
class UserCreate(BaseModel):
    email_or_phone: str
    password: str
    role: str = "user"  # 'admin' or 'user'

class UserOut(BaseModel):
    id: str
    email_or_phone: str
    role: str
    created_at: datetime

class LoginInput(BaseModel):
    email_or_phone: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

# Models
class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

class NearMissEvent(BaseModel):
    id: Optional[str] = None
    location: Location
    description: str
    incident_type: str
    severity: str
    timestamp: datetime = datetime.utcnow()
    reported_by: str
    status: str = "reported"
    additional_info: Optional[dict] = {}

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Welcome to Urban Near Miss Mapper API"}

# ----- Spatial Statistics: Getis-Ord Gi* -----
class GiStarRequest(BaseModel):
    neighborhood_method: Literal['queen', 'rook', 'knn', 'distance_band'] = 'queen'
    k: int = 8
    distance_band_m: Optional[float] = None
    permutations: int = 999
    fdr: bool = True
    use_centroids: bool = False
    cell_size_m: float = 250.0
    buffer_m: float = 0.0

@app.post("/api/spatial/gi_star")
async def compute_gi_star(req: GiStarRequest):
    # 1) Load events from Mongo
    events = []
    async for doc in db.events.find():
        try:
            coords = doc.get('location', {}).get('coordinates', None)
            if coords and isinstance(coords, list) and len(coords) == 2:
                events.append({
                    'lon': float(coords[0]),
                    'lat': float(coords[1])
                })
        except Exception:
            continue

    if not events:
        raise HTTPException(status_code=400, detail="No events found to compute Gi*.")

    events_df = pd.DataFrame(events)

    # 2) Aggregate events to a grid (counts per cell)
    grid_gdf = events_to_grid(events_df, lon_field='lon', lat_field='lat', cell_size_m=req.cell_size_m, buffer_m=req.buffer_m)

    # 3) Compute Gi* on counts
    gi_gdf = gi_star_compute(
        grid_gdf,
        value_field='count',
        neighborhood_method=req.neighborhood_method,
        k=req.k,
        distance_band_m=req.distance_band_m,
        permutations=req.permutations,
        fdr=req.fdr,
        use_centroids=req.use_centroids,
    )

    # 4) Global spatial autocorrelation (Moran's I) on counts for context
    try:
        # Build weights consistent with chosen method for comparability
        # For simplicity, use queen on the grid for Moran's I
        w_gdf = gi_gdf.copy()
        w_gdf = w_gdf.set_geometry('geometry')
        # Use libpysal Queen via GeoDataFrame directly
        from libpysal.weights import Queen
        w = Queen.from_dataframe(w_gdf)
        w.transform = 'R'
        mi = Moran(gi_gdf['count'].to_numpy(dtype=float), w, two_tailed=True, permutations=req.permutations)
        moran_i = float(mi.I)
        moran_p = float(mi.p_sim)
        moran_z = float(mi.z_sim)
    except Exception as e:
        moran_i = None
        moran_p = None
        moran_z = None

    # 5) Save shapefile output
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'outputs'))
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    shp_path = save_as_shapefile(gi_gdf, out_dir, f"gi_star_{timestamp}")

    # 6) Build summary
    z = gi_gdf['z_score'].to_numpy()
    p = gi_gdf['p_value'].to_numpy()
    sig = gi_gdf['significance'].astype(str)

    summary = {
        'n_units': int(len(gi_gdf)),
        'hot_counts': {
            'hot_99': int((sig == 'hot_99').sum()),
            'hot_95': int((sig == 'hot_95').sum()),
            'hot_90': int((sig == 'hot_90').sum()),
        },
        'cold_counts': {
            'cold_99': int((sig == 'cold_99').sum()),
            'cold_95': int((sig == 'cold_95').sum()),
            'cold_90': int((sig == 'cold_90').sum()),
        },
        'fdr_significant_total': int(gi_gdf['fdr_significant'].sum()),
        'z_stats': {
            'min': float(np.nanmin(z)),
            'mean': float(np.nanmean(z)),
            'max': float(np.nanmax(z)),
            'std': float(np.nanstd(z)),
        },
        'moran': {
            'I': moran_i,
            'z': moran_z,
            'p_value': moran_p,
        }
    }

    return {
        'status': 'ok',
        'shapefile_path': shp_path,
        'summary': summary,
    }

# Auth endpoints
@app.post("/auth/signup", response_model=UserOut)
async def signup(user: UserCreate):
    # Check existing user
    existing = await db.credentials.find_one({"email_or_phone": user.email_or_phone})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    user_doc = {
        "email_or_phone": user.email_or_phone,
        "password_hash": hash_password(user.password),
        "role": user.role if user.role in ("admin", "user") else "user",
        "created_at": datetime.utcnow(),
    }
    res = await db.credentials.insert_one(user_doc)
    created = await db.credentials.find_one({"_id": res.inserted_id})
    return UserOut(
        id=str(created["_id"]),
        email_or_phone=created["email_or_phone"],
        role=created["role"],
        created_at=created["created_at"],
    )

@app.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginInput):
    user = await db.credentials.find_one({"email_or_phone": payload.email_or_phone})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user["_id"]), user.get("role", "user"))
    return TokenResponse(access_token=token, role=user.get("role", "user"))

@app.post("/api/events/", response_model=NearMissEvent)
async def create_event(event: NearMissEvent):
    event_dict = event.dict()
    if "id" in event_dict:
        del event_dict["id"]
    
    result = await db.events.insert_one(event_dict)
    created_event = await db.events.find_one({"_id": result.inserted_id})
    return serialize_event(created_event)

@app.get("/api/events/", response_model=List[NearMissEvent])
async def list_events():
    events = []
    async for event in db.events.find():
        events.append(NearMissEvent(**serialize_event(event)))
    return events

@app.get("/api/events/nearby", response_model=List[NearMissEvent])
async def get_nearby_events(lng: float, lat: float, radius_km: int = 5):
    # Perform a geospatial query using a 2dsphere index on location
    max_distance_m = max(0, int(radius_km)) * 1000
    try:
        cursor = db.events.find({
            "location": {
                "$near": {
                    "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "$maxDistance": max_distance_m
                }
            }
        })
        results: List[NearMissEvent] = []
        async for doc in cursor:
            results.append(NearMissEvent(**serialize_event(doc)))
        return results
    except Exception as e:
        # If index is missing or query fails, fall back to empty list
        print(f"Geo query failed: {e}")
        return []

@app.delete("/api/events/{event_id}")
async def delete_event(event_id: str):
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event id")
    res = await db.events.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "deleted", "id": event_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
