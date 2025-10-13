from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional


class SensorReadingBase(BaseModel):
    """Base schema for sensor readings"""
    heart_rate: Optional[float] = Field(None, ge=0, le=300, description="Heart rate in bpm")
    spo2: Optional[float] = Field(None, ge=0, le=100, description="Blood oxygen saturation percentage")
    temperature: Optional[float] = Field(None, ge=-20, le=60, description="Temperature in Celsius")
    humidity: Optional[float] = Field(None, ge=0, le=100, description="Relative humidity percentage")
    gas_resistance: Optional[float] = Field(None, ge=0, description="Gas resistance in kOhms")
    menthone_resistance: Optional[float] = Field(None, ge=0, description="Menthone resistance in kOhms")
    emg_level: Optional[float] = Field(None, ge=0, description="EMG level in microvolts")
    device_id: Optional[str] = Field(None, max_length=100, description="Device identifier")
    battery_level: Optional[float] = Field(None, ge=0, le=100, description="Battery percentage")
    signal_quality: Optional[float] = Field(None, ge=0, le=100, description="Signal quality 0-100")


class SensorReadingCreate(SensorReadingBase):
    """Schema for creating a new sensor reading"""
    timestamp: Optional[datetime] = Field(None, description="Timestamp of reading (server time if not provided)")

    @field_validator('timestamp', mode='before')
    @classmethod
    def set_timestamp(cls, v):
        return v or datetime.utcnow()


class SensorReadingBatch(BaseModel):
    """Schema for batch uploading sensor readings"""
    readings: list[SensorReadingCreate] = Field(..., min_length=1, max_length=100)
    device_id: Optional[str] = Field(None, description="Device identifier for all readings")


class SensorReadingResponse(SensorReadingBase):
    """Schema for sensor reading responses"""
    id: str
    user_id: str
    timestamp: datetime

    class Config:
        from_attributes = True


class SensorDataHistory(BaseModel):
    """Schema for historical sensor data response"""
    readings: list[SensorReadingResponse]
    total_count: int
    start_time: datetime
    end_time: datetime


class SensorDataLatest(BaseModel):
    """Schema for latest sensor readings"""
    heart_rate: Optional[float] = None
    spo2: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    gas_resistance: Optional[float] = None
    menthone_resistance: Optional[float] = None
    emg_level: Optional[float] = None
    timestamp: Optional[datetime] = None
    device_id: Optional[str] = None
    battery_level: Optional[float] = None
    signal_quality: Optional[float] = None


class SensorDataStats(BaseModel):
    """Schema for sensor data statistics"""
    metric: str
    min_value: Optional[float]
    max_value: Optional[float]
    avg_value: Optional[float]
    latest_value: Optional[float]
    readings_count: int
