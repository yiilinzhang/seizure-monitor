# Sensor Data Integration - Quick Start Guide

Your seizure monitor app now supports real-time sensor data from BME660 and MAX30102! 🎉

## What's New

### Backend (FastAPI)
✅ Database model for storing sensor readings
✅ REST API endpoints (`/api/v1/sensor-data`)
✅ WebSocket support for real-time updates
✅ Mock data generator for testing

### Mobile App (React Native)
✅ WebSocket client for real-time data
✅ SensorDataContext for state management
✅ Updated graphs to show real sensor data
✅ Connection status indicators

### Hardware (ESP32)
✅ Complete firmware for ESP32
✅ BME660/680 integration
✅ MAX30102 integration
✅ WiFi connectivity
✅ HTTP POST to backend

---

## Testing Without Hardware (Recommended First!)

### Step 1: Start the Backend
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Step 2: Create a Test User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'
```

### Step 3: Run Mock Sensor Data Generator
```bash
cd backend
python scripts/mock_sensor_sender.py \
  --email test@example.com \
  --password testpass123 \
  --interval 4
```

You should see:
```
✅ [1] HR: 78.2 bpm | SpO2: 97.8% | Temp: 24.3°C | Battery: 100.0%
✅ [2] HR: 76.5 bpm | SpO2: 98.1% | Temp: 24.5°C | Battery: 99.9%
```

### Step 4: Launch Mobile App
```bash
cd SeizureMonitor
npm run ios  # or npm run android
```

Login with `test@example.com` / `testpass123`

**You should now see graphs updating in real-time! 📈**

---

## Testing With Real Hardware

### Step 1: Wire Up Sensors

**BME660/680:**
- VCC → 3.3V
- GND → GND
- SCL → GPIO22
- SDA → GPIO21

**MAX30102:**
- VIN → 3.3V
- GND → GND
- SCL → GPIO22
- SDA → GPIO21

### Step 2: Configure ESP32 Firmware

Edit `hardware/esp32_sensor_hub/platformio.ini`:
```ini
build_flags =
    -D WIFI_SSID=\"YourWiFiName\"
    -D WIFI_PASSWORD=\"YourWiFiPassword\"
    -D API_URL=\"http://192.168.1.100:8000\"
    -D API_TOKEN=\"your_auth_token_here\"
```

**Get your auth token:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

Copy the `token` field from the response.

### Step 3: Upload Firmware

```bash
cd hardware/esp32_sensor_hub
platformio run --target upload
platformio device monitor
```

**Look for:**
```
✅ WiFi connected!
✅ BME680: OK
✅ MAX30102: OK
✅ Data sent successfully!
```

### Step 4: Check Mobile App

Open your app and you should see **LIVE DATA** from your hardware sensors! 🚀

---

## API Endpoints

### POST /api/v1/sensor-data
Submit a single sensor reading
```json
{
  "heart_rate": 75.0,
  "spo2": 98.0,
  "temperature": 23.5,
  "humidity": 45.0,
  "gas_resistance": 105.3,
  "menthone_resistance": 105.3,
  "device_id": "ESP32_001",
  "battery_level": 87.5,
  "signal_quality": 95.0
}
```

### POST /api/v1/sensor-data/batch
Submit multiple readings at once (for offline data)

### GET /api/v1/sensor-data/latest
Get the most recent sensor reading

### GET /api/v1/sensor-data/history?hours=24
Get historical data (default: last 24 hours)

### GET /api/v1/sensor-data/stats/{metric}?hours=24
Get statistics for a specific metric (min, max, avg)

---

## WebSocket Updates

Connect to `ws://localhost:8000/ws?token=YOUR_TOKEN`

**Message format:**
```json
{
  "type": "sensor_update",
  "user_id": "user-uuid",
  "data": {
    "heart_rate": 75.0,
    "spo2": 98.0,
    "timestamp": "2025-01-10T12:34:56.789Z"
  }
}
```

The mobile app automatically subscribes to these updates!

---

## Troubleshooting

### Graphs Not Updating

**Check WebSocket connection:**
- Look for "Connected" chip at top of app
- Check console: `WebSocket connected`

**Check backend logs:**
```bash
cd backend
tail -f logs/app.log  # if logging is configured
```

### ESP32 Not Sending Data

**Check serial monitor:**
```bash
platformio device monitor
```

**Common issues:**
- Wrong WiFi credentials
- Expired auth token
- Backend not accessible from ESP32 network
- Sensors not detected (check I2C wiring)

### No Data in Database

**Check if data is being received:**
```bash
# List recent sensor readings
curl -X GET http://localhost:8000/api/v1/sensor-data/history?hours=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Architecture Overview

```
┌─────────────┐         HTTP POST          ┌──────────────┐
│   ESP32     │  ────────────────────────→  │   FastAPI    │
│  + Sensors  │                             │   Backend    │
└─────────────┘                             └──────────────┘
                                                     │
                                                     │ WebSocket
                                                     ↓
                                            ┌──────────────┐
                                            │ React Native │
                                            │  Mobile App  │
                                            └──────────────┘
```

**Data Flow:**
1. ESP32 reads sensors every 4 seconds
2. Sends HTTP POST to `/api/v1/sensor-data`
3. Backend stores in database
4. Backend broadcasts via WebSocket
5. Mobile app receives update
6. Graphs update in real-time

---

## Next Steps

- ✅ Test with mock data generator
- ✅ Verify graphs update in mobile app
- ⏭️ Wire up real sensors to ESP32
- ⏭️ Upload firmware and test hardware
- ⏭️ Calibrate sensors for accuracy
- ⏭️ Optimize power consumption
- ⏭️ Integrate ML model for seizure prediction

---

## Files Created

**Backend:**
- `backend/app/models/sensor_data.py` - Database model
- `backend/app/schemas/sensor_data.py` - Pydantic schemas
- `backend/app/api/v1/sensor_data.py` - REST endpoints
- `backend/scripts/mock_sensor_sender.py` - Test data generator

**Mobile App:**
- `SeizureMonitor/src/services/websocket.ts` - WebSocket client
- `SeizureMonitor/src/services/api.ts` - Updated with sensor endpoints
- `SeizureMonitor/src/contexts/SensorDataContext.tsx` - State management
- `SeizureMonitor/src/components/HealthMetricsTabs.tsx` - Updated graphs

**Hardware:**
- `hardware/esp32_sensor_hub/src/main.cpp` - ESP32 firmware
- `hardware/esp32_sensor_hub/platformio.ini` - Build configuration
- `hardware/README.md` - Complete hardware guide

---

## Need Help?

1. Check `hardware/README.md` for detailed hardware setup
2. Run mock sensor sender first to test end-to-end
3. Check serial monitor for ESP32 debugging
4. Review backend logs for API errors
5. Check browser console in mobile app for WebSocket issues

Happy monitoring! 📊🔬
