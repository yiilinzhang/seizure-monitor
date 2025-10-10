from twilio.rest import Client
from datetime import datetime
from typing import Dict, Any
from app.core.config import settings

class TwilioService:
    def __init__(self):
        self.client = None
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )

    async def send_sms(self, phone_number: str, user_name: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send SMS notification"""
        if not self.client:
            print("Twilio not configured - SMS simulated")
            return {"success": False, "error": "Twilio not configured"}

        # Clean phone number - remove any spaces
        phone_number = phone_number.replace(" ", "").strip()

        location = event_data["location"]
        delta_pct = event_data["delta_pct"]
        timestamp = event_data["timestamp"]
        event_time = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")
        maps_url = f"https://www.google.com/maps?q={location['lat']},{location['lng']}"

        message = f"""EMERGENCY ALERT: {user_name} is experiencing a seizure.
Time: {event_time}
Location: {maps_url}
Sensor spike: {delta_pct}% above threshold
Emergency services have been notified."""

        try:
            # Debug logging
            print(f"DEBUG: Sending SMS from {settings.TWILIO_PHONE_NUMBER} to {phone_number}")
            print(f"DEBUG: Phone number type: {type(phone_number)}, value: '{phone_number}'")

            result = self.client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            print(f"SMS sent successfully to {phone_number}: {result.sid}")
            return {"success": True, "sid": result.sid}
        except Exception as e:
            print(f"Failed to send SMS to {phone_number}: {e}")
            return {"success": False, "error": str(e)}

    async def make_voice_call(self, phone_number: str, user_name: str) -> Dict[str, Any]:
        """Make voice call notification"""
        if not self.client:
            print("Twilio not configured - Call simulated")
            return {"success": False, "error": "Twilio not configured"}

        # Clean phone number - remove any spaces
        phone_number = phone_number.replace(" ", "").strip()

        try:
            twiml = f"""<Response>
                <Say voice="alice" loop="2">{user_name} is experiencing a seizure now. You have been designated an emergency contact. Please check your SMS for their exact location. Emergency services have been called.</Say>
                <Pause length="2"/>
                <Say voice="alice">Thank you.</Say>
            </Response>"""

            call = self.client.calls.create(
                twiml=twiml,
                to=phone_number,
                from_=settings.TWILIO_PHONE_NUMBER
            )
            print(f"Voice call initiated to {phone_number}: {call.sid}")
            return {"success": True, "sid": call.sid}
        except Exception as e:
            print(f"Failed to call {phone_number}: {e}")
            return {"success": False, "error": str(e)}