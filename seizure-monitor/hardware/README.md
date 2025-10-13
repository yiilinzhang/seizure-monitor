# Seizure Monitor - Hardware Setup

This guide covers the hardware setup for the ESP32-based sensor hub that collects data from BME660 and MAX30102 sensors.

## Hardware Components

### Required Components

1. **ESP32 Development Board** (ESP32-DevKitC or similar)
   - WiFi-enabled microcontroller
   - 38 GPIO pins
   - I2C support

2. **BME660 or BME680** - Environmental Sensor
   - Temperature measurement
   - Humidity measurement
   - Gas resistance (for VOC/menthone detection)
   - I2C interface (address: 0x76 or 0x77)

3. **MAX30102 or MAX30105** - Optical Heart Rate & SpO2 Sensor
   - Heart rate monitoring
   - Blood oxygen saturation (SpO2)
   - I2C interface (address: 0x57)

4. **Additional Components**
   - Breadboard or custom PCB
   - Jumper wires
   - 3.3V power supply or LiPo battery with voltage regulator
   - (Optional) 10k© pull-up resistors for I2C lines

---

## Wiring Diagram

### ESP32 Pin Connections

#### BME660/BME680 Connections
```
BME660          ESP32
------          -----
VCC     ’       3.3V
GND     ’       GND
SCL     ’       GPIO22 (I2C SCL)
SDA     ’       GPIO21 (I2C SDA)
```

#### MAX30102 Connections
```
MAX30102        ESP32
--------        -----
VIN     ’       3.3V
GND     ’       GND
SCL     ’       GPIO22 (I2C SCL)
SDA     ’       GPIO21 (I2C SDA)
INT     ’       (Optional) GPIO25
```

#### Optional: Battery Monitoring
```
Battery+  ’  Voltage Divider  ’  GPIO34 (ADC)
```

### Schematic Notes

- Both sensors share the same I2C bus (GPIO21/GPIO22)
- Power both sensors from ESP32's 3.3V output
- If experiencing I2C issues, add 4.7k© pull-up resistors on SDA and SCL lines to 3.3V

---

## Software Setup

### 1. Install PlatformIO

**Via VSCode:**
1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. Install the [PlatformIO IDE extension](https://platformio.org/install/ide?install=vscode)

**Via CLI:**
```bash
pip install platformio
```

### 2. Configure WiFi and API Credentials

Edit `platformio.ini` and update these values:

```ini
build_flags =
    -D WIFI_SSID=\"YOUR_WIFI_SSID\"
    -D WIFI_PASSWORD=\"YOUR_WIFI_PASSWORD\"
    -D API_URL=\"http://YOUR_SERVER_IP:8000\"
    -D API_TOKEN=\"YOUR_AUTH_TOKEN\"
```

**Get Your Auth Token:**
1. Start the backend server: `cd backend && python -m uvicorn app.main:app --reload`
2. Create/login to get a token:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com","password":"yourpassword"}'
   ```
3. Copy the `token` or `access_token` from the response

### 3. Build and Upload Firmware

```bash
cd hardware/esp32_sensor_hub
platformio run --target upload
```

### 4. Monitor Serial Output

```bash
platformio device monitor
```

You should see output like:
```
========================================
Seizure Monitor - ESP32 Sensor Hub
========================================

Device ID: ESP32_AABBCCDDEEFF
=á Connecting to WiFi: MyWiFi.......
 WiFi connected!
   IP Address: 192.168.1.100
   Signal: -45 dBm

=' Initializing sensors...
   BME680:  OK
   MAX30102:  OK

 Setup complete!

=Ê Reading sensors...
   <!  Temp: 22.5°C | =§ Humid: 45.2% | —  Gas: 105.3 k©
   d  HR: 75 bpm | >Á SpO2: 98%
   =ä Sending to: http://192.168.1.100:8000/api/v1/sensor-data
    Data sent successfully!
```

---

## Testing Without Hardware

Use the mock sensor data generator to test the complete system without physical sensors:

```bash
cd backend
python scripts/mock_sensor_sender.py --email your@email.com --password yourpass
```

This simulates sensor data being sent to the backend every 4 seconds.

---

## Troubleshooting

### Sensor Not Detected

**BME680 not found:**
- Check I2C address (try 0x76 or 0x77)
- Verify wiring connections
- Test with I2C scanner:
  ```cpp
  Wire.beginTransmission(0x76);
  if (Wire.endTransmission() == 0) {
    Serial.println("Found at 0x76");
  }
  ```

**MAX30102 not found:**
- Verify I2C address is 0x57
- Check power supply (needs clean 3.3V)
- Ensure SDA/SCL are connected correctly

### WiFi Connection Issues

- Check SSID and password in `platformio.ini`
- Ensure 2.4GHz WiFi is enabled (ESP32 doesn't support 5GHz)
- Move ESP32 closer to router
- Check serial monitor for detailed WiFi status

### HTTP POST Failures

**401 Unauthorized:**
- Token expired or invalid
- Re-login to get a new token

**404 Not Found:**
- Check `API_URL` is correct
- Ensure backend server is running
- Verify endpoint: `http://YOUR_IP:8000/api/v1/sensor-data`

**Connection Refused:**
- Backend server not running
- Firewall blocking port 8000
- ESP32 and server on different networks

### Heart Rate Reading Issues

The current firmware uses simplified HR detection. For production:

1. Use proper PPG (photoplethysmography) algorithms
2. Implement signal filtering and beat detection
3. Consider using libraries like:
   - [HeartRate library](https://github.com/aromring/MAX30102_by_RF)
   - SparkFun's example algorithms

---

## Power Consumption

**Typical Current Draw:**
- ESP32 active (WiFi on): ~160mA
- BME680: ~12mA during measurement
- MAX30102: ~50mA (LED on)
- **Total: ~220mA**

**Battery Life Estimates:**
- 1000mAh LiPo: ~4.5 hours
- 2000mAh LiPo: ~9 hours
- 3000mAh LiPo: ~13.5 hours

**Power Saving Tips:**
- Use WiFi sleep modes between readings
- Reduce sensor reading frequency
- Implement deep sleep mode

---

## Next Steps

1.  Hardware assembled and tested
2.  Firmware uploaded and sensors reading
3.  Data appearing in mobile app graphs
4. = Calibrate sensors for your environment
5. = Optimize PPG algorithm for accurate HR/SpO2
6. = Design custom PCB for wearable form factor
7. = Implement power management for battery operation
8. = Add ML inference on ESP32 for edge processing

---

## Additional Resources

- [ESP32 Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
- [BME680 Datasheet](https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme680-ds001.pdf)
- [MAX30102 Datasheet](https://datasheets.maximintegrated.com/en/ds/MAX30102.pdf)
- [PlatformIO Documentation](https://docs.platformio.org/)

---

## Support

For issues or questions:
- Check serial monitor output for detailed error messages
- Review API logs: `tail -f backend/logs/app.log`
- Test with mock sensor sender first before debugging hardware
