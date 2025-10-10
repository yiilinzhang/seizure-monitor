from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import List
import os

from app.core.database import get_session
from app.models.user import User
from app.models.emergency_contact import EmergencyContact
from app.models.emergency_event import EmergencyEvent
from app.schemas.emergency import EmergencyTrigger, EmergencyResponse, EmergencyEventResponse
from app.services.twilio_service import TwilioService

router = APIRouter()

@router.post("/trigger", response_model=EmergencyResponse)
async def trigger_emergency(
    trigger_data: EmergencyTrigger,
    db: AsyncSession = Depends(get_session)
):
    """Trigger emergency notification to all contacts"""

    # Get user information
    result = await db.execute(
        select(User).where(User.id == trigger_data.userId)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Log the emergency event
    new_event = EmergencyEvent(
        id=trigger_data.eventId,
        user_id=trigger_data.userId,
        location_lat=trigger_data.location.lat,
        location_lng=trigger_data.location.lng,
        delta_pct=trigger_data.delta_pct,
        timestamp=trigger_data.timestamp
    )
    db.add(new_event)

    # Get all emergency contacts
    result = await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.user_id == trigger_data.userId)
    )
    contacts = result.scalars().all()

    if not contacts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No emergency contacts found for this user",
        )

    # Process notifications
    notification_results = []
    event_data = {
        "location": trigger_data.location.dict(),
        "delta_pct": trigger_data.delta_pct,
        "timestamp": trigger_data.timestamp
    }

    for contact in contacts:
        print(f"Processing emergency notifications for {contact.name} ({contact.phone_number})")

        # Send SMS if enabled
        if trigger_data.sendSMS:
            sms_result = await twilio_service.send_sms(
                contact.phone_number,
                user.name,
                event_data
            )
        else:
            sms_result = {"success": False, "error": "SMS disabled by user settings"}

        # Make voice call if enabled
        if trigger_data.sendCall:
            call_result = await twilio_service.make_voice_call(
                contact.phone_number,
                user.name
            )
        else:
            call_result = {"success": False, "error": "Voice call disabled by user settings"}

        notification_results.append({
            "contact": contact.name,
            "phone": contact.phone_number,
            "sms": sms_result,
            "call": call_result,
            "settings": {
                "smsEnabled": trigger_data.sendSMS,
                "callEnabled": trigger_data.sendCall
            }
        })

    # Check if any notifications were successful
    any_success = any(
        result["sms"]["success"] or result["call"]["success"]
        for result in notification_results
    )

    if not any_success and (trigger_data.sendSMS or trigger_data.sendCall):
        # Don't fail if notifications are disabled
        print("Warning: No notifications were sent successfully")

    await db.commit()

    return EmergencyResponse(
        message="Emergency notifications triggered successfully",
        user=user.name,
        eventId=trigger_data.eventId,
        timestamp=datetime.fromtimestamp(trigger_data.timestamp),
        location=trigger_data.location,
        delta_pct=trigger_data.delta_pct,
        contactsNotified=len(contacts),
        notifications=notification_results
    )

@router.get("/events/{user_id}", response_model=dict)
async def get_emergency_events(
    user_id: str,
    db: AsyncSession = Depends(get_session)
):
    """Get emergency event history for a user"""
    result = await db.execute(
        select(EmergencyEvent)
        .where(EmergencyEvent.user_id == user_id)
        .order_by(EmergencyEvent.triggered_at.desc())
        .limit(50)
    )
    events = result.scalars().all()

    return {
        "events": events,
        "count": len(events)
    }

@router.get("/twiml/{user_name}")
async def twiml_voice(user_name: str):
    """TwiML endpoint for voice calls"""
    message = f"{user_name} is experiencing a seizure now. You have been designated an emergency contact. Please check the location on the phone. Emergency services have been called."

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" loop="2">{message}</Say>
    <Pause length="2"/>
    <Say voice="alice">Thank you.</Say>
</Response>"""

    from fastapi.responses import Response
    return Response(content=twiml, media_type="text/xml")