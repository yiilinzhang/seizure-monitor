# Seizure Monitoring Backend Service

Backend API for the seizure monitoring system that handles emergency contacts and automated notifications when menthone spikes are detected by the BME688 sensor.

## Features

- User authentication (JWT-based)
- Emergency contact management (CRUD operations)
- Automated emergency notifications (voice calls & SMS via Twilio)
- Event logging and history
- SQLite database for data persistence

## Prerequisites

- Node.js (v16+)
- Twilio account for SMS and voice calls
- BME688 sensor on ESP32 (for triggering alerts)

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Copy `.env.example` to `.env` and update with your values:
```bash
cp .env.example .env
```

## Environment Variables

Create a `.env` file with the following:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_PATH=./database.sqlite

# JWT Secret (change this in production)
JWT_SECRET=your-secret-key-change-this-in-production

# Twilio Configuration (required for emergency notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Backend URL (for Twilio callbacks)
BACKEND_URL=http://localhost:3001
```

## Getting Twilio Credentials

1. Sign up for a [Twilio account](https://www.twilio.com/try-twilio)
2. Get your Account SID and Auth Token from the [Twilio Console](https://console.twilio.com)
3. Purchase a phone number from Twilio
4. Update the `.env` file with your credentials

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "securepassword"
}
Response: {
  "token": "jwt_token_here",
  "user": { ... }
}
```

### Emergency Contacts (Requires Authentication)

Include JWT token in Authorization header: `Bearer <token>`

#### Get All Contacts
```
GET /api/contacts
```

#### Add Contact
```
POST /api/contacts
Body: {
  "name": "Emergency Contact Name",
  "phone_number": "+1234567890"
}
```

#### Update Contact
```
PUT /api/contacts/:id
Body: {
  "name": "Updated Name",
  "phone_number": "+0987654321"
}
```

#### Delete Contact
```
DELETE /api/contacts/:id
```

### Emergency Trigger

#### Trigger Emergency Notification
```
POST /api/trigger
Body: {
  "userId": "abc123",
  "eventId": "evt456",
  "location": { "lat": 1.3521, "lng": 103.8198 },
  "delta_pct": 22.5,
  "timestamp": 1737095332
}
```

This endpoint:
1. Validates the user exists
2. Logs the emergency event
3. Fetches all emergency contacts for the user
4. Sends SMS to all contacts with location and details
5. Makes voice calls to all contacts with emergency message

#### Get Event History
```
GET /api/events/:userId
```

### Health Check
```
GET /api/health
```

## Database Schema

### Users Table
- `id` (TEXT, PRIMARY KEY)
- `email` (TEXT, UNIQUE)
- `password` (TEXT, hashed)
- `name` (TEXT)
- `created_at` (DATETIME)

### Emergency Contacts Table
- `id` (INTEGER, PRIMARY KEY)
- `user_id` (TEXT, FOREIGN KEY)
- `name` (TEXT)
- `phone_number` (TEXT)
- `created_at` (DATETIME)

### Emergency Events Table
- `id` (TEXT, PRIMARY KEY)
- `user_id` (TEXT, FOREIGN KEY)
- `location_lat` (REAL)
- `location_lng` (REAL)
- `delta_pct` (REAL)
- `timestamp` (INTEGER)
- `triggered_at` (DATETIME)

## ESP32 Integration

The ESP32 with BME688 sensor should send a POST request to `/api/trigger` when menthone levels exceed the threshold:

```c
// ESP32 example code snippet
HTTPClient http;
http.begin("http://your-backend-url:3001/api/trigger");
http.addHeader("Content-Type", "application/json");

String payload = "{\"userId\":\"" + userId + "\","
                "\"eventId\":\"" + generateEventId() + "\","
                "\"location\":{\"lat\":" + latitude + ",\"lng\":" + longitude + "},"
                "\"delta_pct\":" + String(deltaPercentage) + ","
                "\"timestamp\":" + String(timestamp) + "}";

int httpCode = http.POST(payload);
```

## Emergency Notification Flow

1. **Detection**: BME688 sensor detects menthone spike above threshold
2. **Trigger**: ESP32 sends POST request to `/api/trigger`
3. **Validation**: Backend validates request and user
4. **Notification**: System sends to all emergency contacts:
   - **SMS**: Location link, time, sensor data
   - **Voice Call**: Automated message about seizure event
5. **Logging**: Event stored in database for history

## Voice Call Message

The automated voice call will say:
> "[User's Name] is experiencing a seizure now. You have been designated an emergency contact. Please check the location on the phone. Emergency services have been called."

## SMS Message Format

```
EMERGENCY ALERT: [User's Name] is experiencing a seizure.
Time: [Event Time]
Location: [Google Maps Link]
Sensor spike: [Delta]% above threshold
Emergency services have been notified.
```

## Testing

### Test with cURL

1. Register a user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

2. Login and save token:
```bash
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r '.token')
```

3. Add emergency contact:
```bash
curl -X POST http://localhost:3001/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Emergency Contact","phone_number":"+1234567890"}'
```

4. Trigger emergency (simulate ESP32):
```bash
curl -X POST http://localhost:3001/api/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"your_user_id",
    "eventId":"test_event_001",
    "location":{"lat":1.3521,"lng":103.8198},
    "delta_pct":25.5,
    "timestamp":1737095332
  }'
```

## Deployment

### Heroku
1. Create Heroku app
2. Set environment variables
3. Deploy:
```bash
git push heroku main
```

### Render
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

### Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy with: `railway up`

## Security Notes

- Change `JWT_SECRET` in production
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Add request validation and sanitization
- Consider adding API key authentication for ESP32 devices

## Troubleshooting

### Twilio Errors
- Verify account SID and auth token
- Check phone number format (must include country code)
- Ensure Twilio phone number is verified
- Check Twilio account balance

### Database Errors
- Ensure write permissions for database file
- Check if database path exists
- Verify SQLite3 is properly installed

### Connection Issues
- Check CORS configuration matches frontend URL
- Verify PORT is not already in use
- Ensure firewall allows incoming connections

## Support

For issues or questions, please check the documentation or create an issue in the repository.