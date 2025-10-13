from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class SensorReading(Base):
    """Model for storing sensor readings from the wearable device"""
    __tablename__ = "sensor_readings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # MAX30102/MAX10210 - Heart Rate and SpO2
    heart_rate = Column(Float, nullable=True)  # beats per minute
    spo2 = Column(Float, nullable=True)  # oxygen saturation percentage

    # BME660/BME680 - Environmental sensors
    temperature = Column(Float, nullable=True)  # degrees Celsius
    humidity = Column(Float, nullable=True)  # relative humidity percentage
    gas_resistance = Column(Float, nullable=True)  # gas resistance in kOhms

    # Calculated values
    menthone_resistance = Column(Float, nullable=True)  # kOhms - from BME660 gas sensor

    # EMG or other sensors (placeholder for future expansion)
    emg_level = Column(Float, nullable=True)  # microvolts

    # Device metadata
    device_id = Column(String, nullable=True)  # ESP32 MAC address or device identifier
    battery_level = Column(Float, nullable=True)  # battery percentage
    signal_quality = Column(Float, nullable=True)  # signal quality indicator (0-100)

    # Relationships
    user = relationship("User", back_populates="sensor_readings")

    # Indexes for efficient queries
    __table_args__ = (
        Index('idx_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_timestamp', 'timestamp'),
    )

    def __repr__(self):
        return f"<SensorReading {self.id} user={self.user_id} hr={self.heart_rate} @ {self.timestamp}>"
