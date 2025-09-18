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
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client.near_miss_db

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
    return created_event

@app.get("/api/events/", response_model=List[NearMissEvent])
async def list_events():
    events = []
    async for event in db.events.find():
        events.append(NearMissEvent(**event))
    return events

@app.get("/api/events/nearby")
async def get_nearby_events(lng: float, lat: float, radius_km: int = 5):
    # This would implement a geo-query to find events within a certain radius
    # Implementation would go here
    return {"message": "Nearby events endpoint"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
