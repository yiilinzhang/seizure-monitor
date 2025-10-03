from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Location(BaseModel):
    lat: float
    lng: float

class EmergencyContactBase(BaseModel):
    name: str
    phone_number: str = Field(..., pattern=r'^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,12}$')

class EmergencyContactCreate(EmergencyContactBase):
    pass

class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = Field(None, pattern=r'^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,12}$')

class EmergencyContactResponse(EmergencyContactBase):
    id: int
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class EmergencyTrigger(BaseModel):
    userId: str
    eventId: str
    location: Location
    delta_pct: float
    timestamp: int
    sendSMS: bool = True
    sendCall: bool = True

class NotificationResult(BaseModel):
    contact: str
    phone: str
    sms: dict
    call: dict
    settings: dict

class EmergencyResponse(BaseModel):
    message: str
    user: str
    eventId: str
    timestamp: datetime
    location: Location
    delta_pct: float
    contactsNotified: int
    notifications: List[NotificationResult]

class EmergencyEventResponse(BaseModel):
    id: str
    user_id: str
    location_lat: Optional[float]
    location_lng: Optional[float]
    delta_pct: Optional[float]
    timestamp: Optional[int]
    triggered_at: datetime

    class Config:
        from_attributes = True