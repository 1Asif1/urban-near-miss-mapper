from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import motor.motor_asyncio
from bson import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Urban Near Miss Mapper API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Helper to serialize MongoDB document to API model-friendly dict
def serialize_event(doc: dict) -> dict:
    if not doc:
        return doc
    out = dict(doc)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    return out

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
