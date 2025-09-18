import motor.motor_asyncio
import os
from dotenv import load_dotenv
from bson import ObjectId
from typing import Optional, List, Dict, Any

# Load environment variables
load_dotenv()

# MongoDB connection settings
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "near_miss_db")

# Initialize MongoDB client
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Collections
events_collection = db.events

# Indexes
async def create_indexes():
    # Create 2dsphere index for geospatial queries
    await events_collection.create_index([("location", "2dsphere")])
    # Create indexes for common query fields
    await events_collection.create_index([("incident_type", 1)])
    await events_collection.create_index([("severity", 1)])
    await events_collection.create_index([("status", 1)])
    await events_collection.create_index([("timestamp", -1)])

# Helper function to convert MongoDB document to dict
def event_helper(event) -> dict:
    return {
        "id": str(event["_id"]),
        "location": event["location"],
        "description": event["description"],
        "incident_type": event["incident_type"],
        "severity": event["severity"],
        "timestamp": event["timestamp"],
        "reported_by": event["reported_by"],
        "status": event.get("status", "reported"),
        "additional_info": event.get("additional_info", {})
    }
