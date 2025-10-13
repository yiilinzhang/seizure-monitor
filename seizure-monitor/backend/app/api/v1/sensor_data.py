from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, func
from datetime import datetime, timedelta
from typing import Optional
import logging

from app.core.database import get_session
from app.models.sensor_data import SensorReading
from app.models.user import User
from app.schemas.sensor_data import (
    SensorReadingCreate,
    SensorReadingResponse,
    SensorReadingBatch,
    SensorDataHistory,
    SensorDataLatest,
    SensorDataStats
)
from app.api.v1.auth import get_current_user
from app.websocket.handlers import manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/sensor-data", response_model=SensorReadingResponse, status_code=status.HTTP_201_CREATED)
async def create_sensor_reading(
    reading: SensorReadingCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new sensor reading for the authenticated user.
    This endpoint is typically called by the ESP32 device.
    """
    # Create sensor reading
    db_reading = SensorReading(
        user_id=current_user.id,
        timestamp=reading.timestamp or datetime.utcnow(),
        heart_rate=reading.heart_rate,
        spo2=reading.spo2,
        temperature=reading.temperature,
        humidity=reading.humidity,
        gas_resistance=reading.gas_resistance,
        menthone_resistance=reading.menthone_resistance,
        emg_level=reading.emg_level,
        device_id=reading.device_id,
        battery_level=reading.battery_level,
        signal_quality=reading.signal_quality
    )

    session.add(db_reading)
    await session.commit()
    await session.refresh(db_reading)

    logger.info(f"Created sensor reading {db_reading.id} for user {current_user.id}")

    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "sensor_update",
        "user_id": current_user.id,
        "data": {
            "id": db_reading.id,
            "timestamp": db_reading.timestamp.isoformat(),
            "heart_rate": db_reading.heart_rate,
            "spo2": db_reading.spo2,
            "temperature": db_reading.temperature,
            "humidity": db_reading.humidity,
            "gas_resistance": db_reading.gas_resistance,
            "menthone_resistance": db_reading.menthone_resistance,
            "emg_level": db_reading.emg_level,
            "battery_level": db_reading.battery_level,
            "signal_quality": db_reading.signal_quality
        }
    })

    return db_reading


@router.post("/sensor-data/batch", status_code=status.HTTP_201_CREATED)
async def create_sensor_readings_batch(
    batch: SensorReadingBatch,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Create multiple sensor readings in batch.
    Useful for offline data upload or bulk data transfer from ESP32.
    """
    readings_created = []

    for reading in batch.readings:
        db_reading = SensorReading(
            user_id=current_user.id,
            timestamp=reading.timestamp or datetime.utcnow(),
            heart_rate=reading.heart_rate,
            spo2=reading.spo2,
            temperature=reading.temperature,
            humidity=reading.humidity,
            gas_resistance=reading.gas_resistance,
            menthone_resistance=reading.menthone_resistance,
            emg_level=reading.emg_level,
            device_id=reading.device_id or batch.device_id,
            battery_level=reading.battery_level,
            signal_quality=reading.signal_quality
        )
        session.add(db_reading)
        readings_created.append(db_reading)

    await session.commit()

    logger.info(f"Created {len(readings_created)} sensor readings for user {current_user.id}")

    # Broadcast latest reading to WebSocket clients
    if readings_created:
        latest = readings_created[-1]
        await manager.broadcast({
            "type": "sensor_update",
            "user_id": current_user.id,
            "data": {
                "id": latest.id,
                "timestamp": latest.timestamp.isoformat(),
                "heart_rate": latest.heart_rate,
                "spo2": latest.spo2,
                "temperature": latest.temperature,
                "humidity": latest.humidity,
                "gas_resistance": latest.gas_resistance,
                "menthone_resistance": latest.menthone_resistance,
                "emg_level": latest.emg_level,
                "battery_level": latest.battery_level,
                "signal_quality": latest.signal_quality
            }
        })

    return {"created": len(readings_created), "message": f"Successfully created {len(readings_created)} readings"}


@router.get("/sensor-data/latest", response_model=SensorDataLatest)
async def get_latest_sensor_reading(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get the most recent sensor reading for the authenticated user"""
    stmt = select(SensorReading).where(
        SensorReading.user_id == current_user.id
    ).order_by(desc(SensorReading.timestamp)).limit(1)

    result = await session.execute(stmt)
    reading = result.scalar_one_or_none()

    if not reading:
        return SensorDataLatest()

    return SensorDataLatest(
        heart_rate=reading.heart_rate,
        spo2=reading.spo2,
        temperature=reading.temperature,
        humidity=reading.humidity,
        gas_resistance=reading.gas_resistance,
        menthone_resistance=reading.menthone_resistance,
        emg_level=reading.emg_level,
        timestamp=reading.timestamp,
        device_id=reading.device_id,
        battery_level=reading.battery_level,
        signal_quality=reading.signal_quality
    )


@router.get("/sensor-data/history", response_model=SensorDataHistory)
async def get_sensor_reading_history(
    hours: int = Query(default=24, ge=1, le=168, description="Hours of history to retrieve"),
    limit: int = Query(default=1000, ge=1, le=10000, description="Maximum number of readings"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get historical sensor readings for the authenticated user"""
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)

    # Get total count
    count_stmt = select(func.count(SensorReading.id)).where(
        and_(
            SensorReading.user_id == current_user.id,
            SensorReading.timestamp >= start_time,
            SensorReading.timestamp <= end_time
        )
    )
    count_result = await session.execute(count_stmt)
    total_count = count_result.scalar()

    # Get readings
    stmt = select(SensorReading).where(
        and_(
            SensorReading.user_id == current_user.id,
            SensorReading.timestamp >= start_time,
            SensorReading.timestamp <= end_time
        )
    ).order_by(desc(SensorReading.timestamp)).limit(limit)

    result = await session.execute(stmt)
    readings = result.scalars().all()

    return SensorDataHistory(
        readings=readings,
        total_count=total_count,
        start_time=start_time,
        end_time=end_time
    )


@router.get("/sensor-data/stats/{metric}", response_model=SensorDataStats)
async def get_sensor_stats(
    metric: str,
    hours: int = Query(default=24, ge=1, le=168),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Get statistics for a specific sensor metric"""
    valid_metrics = ["heart_rate", "spo2", "temperature", "humidity", "gas_resistance", "menthone_resistance", "emg_level"]

    if metric not in valid_metrics:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid metric. Must be one of: {', '.join(valid_metrics)}"
        )

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)

    # Build query to get stats
    metric_col = getattr(SensorReading, metric)

    stmt = select(
        func.min(metric_col).label('min_value'),
        func.max(metric_col).label('max_value'),
        func.avg(metric_col).label('avg_value'),
        func.count(SensorReading.id).label('count')
    ).where(
        and_(
            SensorReading.user_id == current_user.id,
            SensorReading.timestamp >= start_time,
            SensorReading.timestamp <= end_time,
            metric_col.isnot(None)
        )
    )

    result = await session.execute(stmt)
    stats = result.one_or_none()

    # Get latest value
    latest_stmt = select(metric_col).where(
        and_(
            SensorReading.user_id == current_user.id,
            metric_col.isnot(None)
        )
    ).order_by(desc(SensorReading.timestamp)).limit(1)

    latest_result = await session.execute(latest_stmt)
    latest_value = latest_result.scalar_one_or_none()

    if not stats or stats.count == 0:
        return SensorDataStats(
            metric=metric,
            min_value=None,
            max_value=None,
            avg_value=None,
            latest_value=latest_value,
            readings_count=0
        )

    return SensorDataStats(
        metric=metric,
        min_value=float(stats.min_value) if stats.min_value is not None else None,
        max_value=float(stats.max_value) if stats.max_value is not None else None,
        avg_value=float(stats.avg_value) if stats.avg_value is not None else None,
        latest_value=float(latest_value) if latest_value is not None else None,
        readings_count=stats.count
    )


@router.delete("/sensor-data", status_code=status.HTTP_204_NO_CONTENT)
async def delete_old_sensor_readings(
    days: int = Query(default=30, ge=1, le=365, description="Delete readings older than this many days"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete old sensor readings to manage storage"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    stmt = select(SensorReading).where(
        and_(
            SensorReading.user_id == current_user.id,
            SensorReading.timestamp < cutoff_date
        )
    )

    result = await session.execute(stmt)
    readings_to_delete = result.scalars().all()

    for reading in readings_to_delete:
        await session.delete(reading)

    await session.commit()

    logger.info(f"Deleted {len(readings_to_delete)} old sensor readings for user {current_user.id}")

    return None
