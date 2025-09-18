from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseConfig

# Custom Pydantic config to handle MongoDB ObjectId
class MongoModel(BaseModel):
    class Config(BaseConfig):
        json_encoders = {
            ObjectId: str
        }
        allow_population_by_field_name = True

# Location model
class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

# Base NearMissEvent model
class NearMissEventBase(MongoModel):
    location: Location
    description: str
    incident_type: str
    severity: str
    timestamp: datetime = datetime.utcnow()
    reported_by: str
    status: str = "reported"
    additional_info: Optional[dict] = {}

# For creating new events (excludes id)
class NearMissEventCreate(NearMissEventBase):
    pass

# For returning event data (includes id)
class NearMissEvent(NearMissEventBase):
    id: str = Field(..., alias="_id")

# For updating events
class NearMissEventUpdate(MongoModel):
    description: Optional[str] = None
    incident_type: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    additional_info: Optional[dict] = None

# For query parameters
class EventQueryParams(MongoModel):
    incident_type: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
