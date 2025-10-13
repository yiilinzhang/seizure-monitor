# Arduino IDE Setup Guide for Seizure Monitor

**Easy step-by-step guide to get your ESP32 sensors working!**

---

## Step 1: Install Arduino IDE

1. Download Arduino IDE from: https://www.arduino.cc/en/software
2. Install it (just click through the installer)
3. Open Arduino IDE

---

## Step 2: Add ESP32 Board Support

### 2.1 Open Preferences
- Go to **File → Preferences** (or Arduino IDE → Settings on Mac)

### 2.2 Add ESP32 Board Manager URL
- Find "Additional Board Manager URLs" field
- Paste this URL:
  ```
  https://dl.espressif.com/dl/package_esp32_index.json
  ```
- Click **OK**

### 2.3 Install ESP32 Board
- Go to **Tools → Board → Boards Manager**
- Search for `esp32`
- Find "esp32 by Espressif Systems"
- Click **Install** (wait a few minutes for download)
- Click **Close**

---

## Step 3: Install Required Libraries

Go to **Sketch → Include Library → Manage Libraries** (or Ctrl+Shift+I)

### Install these 4 libraries (search and install each):

#### 3.1 Adafruit BME680 Library
- Search: `Adafruit BME680`
- Find: "Adafruit BME680 Library" by Adafruit
- Click **Install**
- When asked "Install all dependencies?" → Click **Install All**

#### 3.2 SparkFun MAX3010x Library
- Search: `SparkFun MAX3010x`
- Find: "SparkFun MAX3010x Pulse and Proximity Sensor Library" by SparkFun
- Click **Install**

#### 3.3 ArduinoJson
- Search: `ArduinoJson`
- Find: "ArduinoJson" by Benoit Blanchon
- **IMPORTANT:** Install version 7.x (check version number)
- Click **Install**

#### 3.4 Adafruit Unified Sensor (if not already installed)
- Search: `Adafruit Unified Sensor`
- Find: "Adafruit Unified Sensor" by Adafruit
- Click **Install**

**Close the Library Manager when done.**

---

## Step 4: Open the Seizure Monitor Sketch

1. Navigate to your project folder:
   ```
   seizure-monitor/hardware/esp32_sensor_hub_arduino/
   ```
2. Double-click `esp32_sensor_hub_arduino.ino`
3. Arduino IDE should open with the sketch

---

## Step 5: Edit Configuration (IMPORTANT!)

At the top of the code, edit these lines:

```cpp
// WiFi credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";           // ← Your WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";   // ← Your WiFi password

// API configuration
const char* API_URL = "http://192.168.1.100:8000";  // ← Your computer's IP
const char* API_TOKEN = "YOUR_AUTH_TOKEN_HERE";     // ← Get from backend
```

### How to Get Your Auth Token:

1. Make sure your backend is running:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. Login to get a token:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

3. Copy the `token` value from the response
4. Paste it into `API_TOKEN` in the code

### How to Find Your Computer's IP:

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address"
```

Use this IP in `API_URL` like: `http://192.168.1.100:8000`

---

## Step 6: Select Your Board

1. Go to **Tools → Board**
2. Navigate to **ESP32 Arduino**
3. Select **ESP32 Dev Module**

---

## Step 7: Connect ESP32 to Your Computer

1. Plug ESP32 into your computer via USB cable
2. Wait a few seconds for drivers to install

### Select the Port:
1. Go to **Tools → Port**
2. Select the port that says "ESP32" or "USB" or "SLAB_USBtoUART"
   - Mac: `/dev/cu.usbserial-xxxx` or `/dev/cu.SLAB_USBtoUART`
   - Windows: `COM3`, `COM4`, etc.
   - Linux: `/dev/ttyUSB0` or `/dev/ttyACM0`

**If no port appears:**
- Install CP210x USB driver: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- Or CH340 driver if using CH340 chip

---

## Step 8: Wire Up Your Sensors (Before Uploading!)

### BME680 to ESP32:
```
BME680    →    ESP32
VCC       →    3.3V
GND       →    GND
SCL       →    GPIO 22
SDA       →    GPIO 21
```

### MAX30102 to ESP32:
```
MAX30102  →    ESP32
VIN       →    3.3V
GND       →    GND
SCL       →    GPIO 22 (same as BME680)
SDA       →    GPIO 21 (same as BME680)
```

**Both sensors share the same I2C pins (21 and 22)!**

---

## Step 9: Upload the Code

1. Click the **Upload** button (right arrow icon) or press **Ctrl+U**
2. Wait for compilation and upload (1-2 minutes)
3. Look for "Done uploading" message

**If you see errors:**
- Check that ESP32 board is selected
- Check that correct port is selected
- Try pressing the "BOOT" button on ESP32 when uploading starts

---

## Step 10: Open Serial Monitor

1. Click **Tools → Serial Monitor** (or Ctrl+Shift+M)
2. Set baud rate to **115200** in the bottom right

**You should see:**
```
========================================
Seizure Monitor - ESP32 Sensor Hub
Arduino IDE Version
========================================

Device ID: ESP32_AABBCCDDEEFF
📡 Connecting to WiFi: MyWiFi........
✅ WiFi connected!
   IP Address: 192.168.1.105
   Signal: -45 dBm

🔧 Initializing sensors...
   BME680: ✅ OK
   MAX30102: ✅ OK

✅ Setup complete!

📊 Reading sensors...
   🌡️  Temp: 22.5°C | 💧 Humid: 45.2% | ⚗️  Gas: 105.3 kΩ
   ❤️  HR: 75 bpm | 🫁 SpO2: 98%
   📤 Sending to: http://192.168.1.100:8000/api/v1/sensor-data
   ✅ Data sent successfully!
```

---

## Troubleshooting

### WiFi Not Connecting
```
❌ WiFi connection failed!
```
**Fix:**
- Check SSID and password are correct (case-sensitive!)
- Make sure you're using 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Move ESP32 closer to router

### Sensor Not Found
```
❌ BME680: Not found
```
**Fix:**
- Check wiring (VCC, GND, SDA, SCL)
- BME680 uses address 0x76 or 0x77
- Try swapping SDA and SCL wires
- Check sensor has power (3.3V, NOT 5V!)

### Upload Failed
```
A fatal error occurred: Failed to connect
```
**Fix:**
- Press and hold "BOOT" button on ESP32 when uploading
- Try a different USB cable
- Install USB drivers (CP210x or CH340)
- Check correct port is selected

### HTTP Error 401
```
⚠️  Server response: 401
```
**Fix:**
- Your auth token expiredth
- Get a new token (Step 5)
- Update `API_TOKEN` in code
- Re-upload code

### No Finger Detected
```
⚠️  No finger detected on MAX30102
```
**This is normal!** Place your finger on the sensor to get readings.

---

## Next Steps

Once you see "Data sent successfully!":

1. ✅ Open your mobile app
2. ✅ Login with your account
3. ✅ Watch graphs update in real-time!
4. ✅ Place finger on MAX30102 to see heart rate

---

## Testing Without Hardware

Don't have sensors yet? Test the full system with mock data:

```bash
cd backend
python scripts/mock_sensor_sender.py \
  --email test@example.com \
  --password testpass123
```

This simulates sensor data so you can test your app!

---

## Need Help?

**Common issues:**
1. WiFi not connecting → Check SSID/password and 2.4GHz WiFi
2. Sensor not found → Check wiring and I2C addresses
3. Upload failed → Install USB drivers and hold BOOT button
4. HTTP 401 error → Get new auth token

**Still stuck?**
- Check Serial Monitor for error messages
- Verify backend is running on port 8000
- Test with mock data first (see above)

---

## Files Location

**Arduino Sketch:**
```
seizure-monitor/hardware/esp32_sensor_hub_arduino/esp32_sensor_hub_arduino.ino
```

**Open this file in Arduino IDE to get started!**

Happy monitoring! 📊🔬
