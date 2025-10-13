# I2C Hardware Troubleshooting Guide

## Problem: I2C Hardware Timeout Errors

If you're seeing errors like:
```
E (77234) i2c.master: s_i2c_synchronous_transaction(945): I2C transaction failed
E (77241) i2c.master: i2c_master_transmit_receive(1248): I2C transaction failed
E (77251) i2c.master: I2C hardware timeout detected
```

This indicates the ESP32 cannot communicate with sensors on the I2C bus.

## Common Causes & Solutions

### 1. **Power Issues** (Most Common)

**Problem**: Multiple sensors draw too much current from ESP32's 3.3V pin

**Symptoms**:
- Sensors work initially then fail
- Intermittent connection (works then doesn't work)
- One sensor works alone, but both together fail

**Solution**:
```
Test with ONE sensor at a time:
1. Disconnect MAX30102 completely
2. Test BME680 alone - does it work?
3. If yes → power issue confirmed
4. Use external 3.3V power supply (NOT from ESP32 pin)
```

**How to add external power**:
- Use a separate 3.3V voltage regulator
- Connect VCC of both sensors to external 3.3V supply
- Keep GND common (ESP32 GND = Sensor GND = External supply GND)
- Keep SDA/SCL connected to ESP32

### 2. **Loose Connections**

**Problem**: Breadboard connections are not secure

**Symptoms**:
- Sensor "worked just now" but suddenly stopped
- Works when you touch/press wires

**Solution**:
- Push wires firmly into breadboard
- Check jumper wires aren't bent/damaged
- Try different breadboard holes
- Consider soldering connections for reliability

### 3. **Missing Pull-up Resistors**

**Problem**: I2C bus requires pull-up resistors on SDA and SCL lines

**Check**:
- Some ESP32 boards have built-in pull-ups (usually work without external)
- Some sensor breakout boards have pull-ups (BME680/MAX30102 usually do)

**If needed, add**:
- 4.7kΩ resistor from SDA to 3.3V
- 4.7kΩ resistor from SCL to 3.3V

### 4. **Wrong Wiring**

**Verify connections**:
```
BME680:
- VCC → ESP32 3.3V
- GND → ESP32 GND
- SDA → ESP32 GPIO 21
- SCL → ESP32 GPIO 22

MAX30102:
- VIN → ESP32 3.3V (or 5V if available)
- GND → ESP32 GND
- SDA → ESP32 GPIO 21
- SCL → ESP32 GPIO 22

EMG Sensor:
- VCC → ESP32 3.3V
- GND → ESP32 GND
- Signal → ESP32 GPIO 35
```

### 5. **EMG Interference**

**Problem**: High-frequency EMG sampling (50Hz) conflicts with I2C

**Current code handles this** by:
- Pausing EMG during I2C reads
- Using slower I2C clock (100kHz instead of 400kHz)

**If still having issues**:
- Reduce EMG sampling rate (change `EMG_READING_INTERVAL` to 50ms or 100ms)
- Disable EMG temporarily to test if it's the cause

## Diagnostic Steps

### Step 1: Run I2C Scanner
The Arduino code now includes automatic I2C scanning on startup. Check Serial Monitor for:
```
🔍 Scanning I2C bus...
   ✅ I2C device found at 0x76  (BME680)
   ✅ I2C device found at 0x57  (MAX30102)
   Found 2 device(s)
```

### Step 2: Test Sensors Individually

**Test BME680 alone**:
1. Disconnect MAX30102 from breadboard
2. Upload code and check Serial Monitor
3. Should see: `BME680: ✅ OK`

**Test MAX30102 alone**:
1. Disconnect BME680 from breadboard
2. Upload code and check Serial Monitor
3. Should see: `MAX30102: ✅ OK` and red LED should light up

### Step 3: Check Power Voltage

**Use multimeter**:
1. Measure voltage at BME680 VCC pin (should be 3.2-3.3V)
2. Measure voltage at MAX30102 VCC pin (should be 3.2-3.3V)
3. If below 3.0V → insufficient power

### Step 4: Auto-Recovery Feature

**New in firmware**: Automatic I2C bus reset
- After 5 consecutive failures, bus automatically resets
- Watch Serial Monitor for: `🔄 Resetting I2C bus...`
- If this happens repeatedly → hardware issue

## Hardware Recommendations

### For Reliable Operation:

1. **Use external power supply** for sensors (not ESP32 3.3V pin)
2. **Solder connections** instead of breadboard
3. **Keep wires short** (< 10cm for I2C)
4. **Use shielded cables** in noisy environments
5. **Add decoupling capacitors**:
   - 0.1µF ceramic capacitor near each sensor VCC/GND
   - 10µF electrolytic capacitor at power supply

### Quick Test Setup:
```
For initial testing (simplest setup):
1. Connect ONLY BME680
2. Use ESP32 3.3V pin for power
3. Short wires (< 5cm)
4. Verify it works consistently
5. Then add MAX30102 if needed
```

## Code Improvements Added

The Arduino code now includes:

✅ **I2C Scanner** - Shows which devices are detected
✅ **Slower I2C Clock** - 100kHz for reliability
✅ **Sensor Retry Logic** - 3 attempts per sensor on startup
✅ **Auto I2C Reset** - Resets bus after 5 failures
✅ **EMG Pause** - Pauses EMG during I2C operations
✅ **Better Error Messages** - Clear troubleshooting hints

## Still Not Working?

If none of the above helps:

1. **Test with different ESP32 board** - your board may be faulty
2. **Test with different sensors** - sensor may be damaged
3. **Try Arduino example sketches** - test basic I2C functionality
4. **Check ESP32 chip revision** - older chips have I2C bugs

## Useful Arduino Examples to Test:

Test basic I2C with Arduino IDE:
```
File → Examples → Wire → i2c_scanner
```

This simple sketch will show if ANY I2C devices are detected.
