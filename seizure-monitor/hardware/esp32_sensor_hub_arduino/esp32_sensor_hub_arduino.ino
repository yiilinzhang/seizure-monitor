/**
 * Seizure Monitor - ESP32 Sensor Hub (Arduino IDE Version)
 *
 * This sketch reads sensor data from:
 * - BME660/BME680: Temperature, Humidity, Gas Resistance
 * - MAX30102/MAX30105: Heart Rate, SpO2
 * - EMG Sensor: Muscle activity monitoring
 *
 * And sends it to the backend API via HTTP POST
 *
 * REQUIRED LIBRARIES (Install via Arduino Library Manager):
 * 1. Adafruit BME680 Library (by Adafruit)
 * 2. Adafruit Unified Sensor (by Adafruit)
 * 3. SparkFun MAX3010x Sensor Library (by SparkFun)
 * 4. ArduinoJson (by Benoit Blanchon) - Version 7.x
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_BME680.h>
// #include <MAX30105.h>  // MAX30102 disabled - testing BME680 only

// ===== CONFIGURATION - EDIT THESE VALUES =====

// WiFi credentials
// IMPORTANT:
// - WiFi name is case-sensitive!
// - ESP32 only works with 2.4GHz WiFi (not 5GHz)
// - Make sure password is correct
const char* WIFI_SSID = "ev3";           // Change this to your WiFi name
const char* WIFI_PASSWORD = "yyyolinn";   // Change this to your WiFi password

// API configuration
// Your Mac's current IP: 172.20.10.2
// To check IP: System Settings → Network → WiFi → Details → TCP/IP
const char* API_URL = "http://172.20.10.2:8000";  // Your Mac's IP address
const char* API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODVkNGI5NC1jNjg2LTRmZTctYTMzYi1mOTEzMTg2NTRiOWMiLCJlbWFpbCI6ImFyZHVpbm9AdGVzdC5jb20iLCJleHAiOjE3NjA0MzQ0NzMsImlhdCI6MTc2MDM0ODA3M30.YxdW2Co1hB1r75MS7Bknn6Gm8uV-X1D_4VUNFlXCYSw";  // Auth token for arduino@test.com

// ===== END CONFIGURATION =====

// Sensor reading intervals (milliseconds)
#define READING_INTERVAL 4000   // 4 seconds for BME680/MAX30102
#define EMG_READING_INTERVAL 20 // 20ms for EMG (50 Hz sampling rate)

// I2C pins
// For ESP32 (original): SDA=21, SCL=22
// For ESP32-S3: Can use any GPIO pins
// Try GPIO 8/10 if 8/9 doesn't work
#define I2C_SDA 8   // GPIO 8 for ESP32-S3
#define I2C_SCL 10  // GPIO 10 for ESP32-S3 (changed from 9)

// EMG sensor pin (analog input)
// For ESP32-S3, use GPIO 1-10 for ADC (GPIO 35 doesn't exist on S3)
#define EMG_PIN 1  // GPIO 1 (ADC1_CH0) for ESP32-S3

// EMG signal processing
#define EMG_SAMPLES 10      // Number of samples for moving average (faster response)
#define EMG_THRESHOLD 100   // Baseline threshold for activity detection

// Sensor objects
Adafruit_BME680 bme;
// MAX30105 particleSensor;  // MAX30102 disabled

// Timing
unsigned long lastReading = 0;
unsigned long lastEMGReading = 0;
unsigned long lastWiFiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL = 30000; // Check WiFi every 30s

// Device ID (MAC address)
String deviceId;

// EMG signal buffer for filtering
int emgBuffer[EMG_SAMPLES];
int emgBufferIndex = 0;
bool emgBufferFilled = false;

// EMG statistics for aggregation
float lastEMGValue = 0;
float emgMin = 100;
float emgMax = 0;
float emgSum = 0;
int emgCount = 0;

// Function declarations
void setupWiFi();
void setupSensors();
void resetI2CBus();
bool readBME680(float &temp, float &humidity, float &gasResistance);
bool readMAX30102(float &heartRate, float &spo2);
float readEMG();
void sendSensorData(float temp, float humidity, float gas, float hr, float spo2, float emg);
float getBatteryLevel();

// Track I2C failures for automatic reset
int i2cFailureCount = 0;
const int I2C_MAX_FAILURES = 5;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("Seizure Monitor - ESP32 Sensor Hub");
  Serial.println("Arduino IDE Version");
  Serial.println("========================================\n");

  // Get device ID from MAC address
  uint8_t mac[6];
  WiFi.macAddress(mac);
  deviceId = "";
  for (int i = 0; i < 6; i++) {
    if (mac[i] < 16) deviceId += "0";
    deviceId += String(mac[i], HEX);
  }
  deviceId.toUpperCase();
  Serial.printf("Device ID: ESP32_%s\n", deviceId.c_str());

  // Initialize I2C with slower speed for reliability
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);  // 100kHz (slow but reliable)
  delay(100);  // Give I2C time to stabilize

  Serial.println("✅ I2C bus initialized at 100kHz");

  // EMG DISABLED FOR TESTING - Uncomment to enable
  // // Initialize EMG pin
  // pinMode(EMG_PIN, INPUT);
  // analogReadResolution(12);  // 12-bit ADC (0-4095)
  //
  // // Initialize EMG buffer
  // for (int i = 0; i < EMG_SAMPLES; i++) {
  //   emgBuffer[i] = 0;
  // }

  // Setup WiFi
  setupWiFi();

  // Setup sensors
  setupSensors();

  Serial.println("\n✅ Setup complete!\n");
  Serial.println("⏸️  Waiting 5 seconds before starting sensor readings...\n");
  Serial.println("LOOK ABOVE FOR I2C SCAN RESULTS!\n");

  delay(5000);  // Give you time to see the scan results
}

void loop() {
  unsigned long currentMillis = millis();

  // Check WiFi connection periodically
  if (currentMillis - lastWiFiCheck >= WIFI_CHECK_INTERVAL) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("⚠️  WiFi disconnected, reconnecting...");
      setupWiFi();
    }
    lastWiFiCheck = currentMillis;
  }

  // EMG DISABLED FOR TESTING
  // // Read EMG at high frequency (50 Hz)
  // if (currentMillis - lastEMGReading >= EMG_READING_INTERVAL) {
  //   lastEMGReading = currentMillis;
  //   lastEMGValue = readEMG();
  //
  //   // Track statistics for aggregation
  //   emgSum += lastEMGValue;
  //   emgCount++;
  //   if (lastEMGValue < emgMin) emgMin = lastEMGValue;
  //   if (lastEMGValue > emgMax) emgMax = lastEMGValue;
  // }

  // Read other sensors and send data at slower interval
  if (currentMillis - lastReading >= READING_INTERVAL) {
    lastReading = currentMillis;

    Serial.println("📊 Reading sensors...");

    // Check if I2C bus needs reset due to accumulated failures
    if (i2cFailureCount >= I2C_MAX_FAILURES) {
      Serial.printf("⚠️  Too many I2C failures (%d), attempting bus reset...\n", i2cFailureCount);
      resetI2CBus();
      delay(500);  // Give sensors time to recover
    }

    // Pause EMG sampling during I2C operations to avoid conflicts
    lastEMGReading = currentMillis;  // Reset EMG timer

    // Read sensor data
    float temperature = -1, humidity = -1, gasResistance = -1;

    bool bmeOk = readBME680(temperature, humidity, gasResistance);

    if (!bmeOk) {
      Serial.println("   🌡️  BME680: ❌ Sensor disconnected or I2C error");
      i2cFailureCount++;
    } else {
      // Success - reduce failure count gradually
      if (i2cFailureCount > 0) i2cFailureCount--;
    }

    // EMG DISABLED FOR TESTING
    float emgAverage = -1;  // Disabled
    // // Calculate EMG average from high-frequency samples
    // float emgAverage = emgCount > 0 ? emgSum / emgCount : lastEMGValue;
    //
    // if (emgAverage < 0 || lastEMGValue < 0) {
    //   Serial.println("   💪 EMG: ❌ Sensor not connected (GPIO 35)");
    //   emgAverage = -1;  // Don't send invalid data
    // } else {
    //   Serial.printf("   💪 EMG Stats - Avg: %.1f%% | Current: %.1f%% | Max: %.1f%% (samples: %d)\n",
    //                 emgAverage, lastEMGValue, emgMax, emgCount);
    // }

    // MAX30102 disabled for testing
    float heartRate = -1, spo2 = -1;
    bool maxOk = false;
    // bool maxOk = readMAX30102(heartRate, spo2);
    //
    // if (!maxOk) {
    //   Serial.println("   ❤️  MAX30102: ❌ No finger detected or sensor disconnected");
    //   i2cFailureCount++;
    // } else {
    //   // Success - reduce failure count gradually
    //   if (i2cFailureCount > 0) i2cFailureCount--;
    // }

    // Send data to server if we have any valid readings
    if (bmeOk || maxOk || (emgAverage >= 0)) {
      sendSensorData(
        temperature,
        humidity,
        gasResistance,
        heartRate,
        spo2,
        emgAverage
      );
    } else {
      Serial.println("   ❌ No valid sensor readings");
    }

    // EMG DISABLED FOR TESTING
    // // Reset EMG statistics
    // emgSum = 0;
    // emgCount = 0;
    // emgMin = 100;
    // emgMax = 0;

    Serial.println();
  }

  delay(1);  // Small delay to prevent watchdog issues
}

void setupWiFi() {
  Serial.printf("📡 Connecting to WiFi: %s\n", WIFI_SSID);
  Serial.println("   (This may take 10-20 seconds...)\n");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {  // Increased to 40 attempts (20 seconds)
    delay(500);
    Serial.print(".");
    attempts++;

    if (attempts % 10 == 0) {
      Serial.printf(" (%d/40)\n", attempts);
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.printf("   IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   Signal: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n\n========================================");
    Serial.println("❌ WiFi connection FAILED!");
    Serial.println("========================================");
    Serial.printf("   SSID: %s\n", WIFI_SSID);
    Serial.println("\n   TROUBLESHOOTING:");
    Serial.println("   1. Check WiFi name is correct (case-sensitive)");
    Serial.println("   2. Check WiFi password is correct");
    Serial.println("   3. Make sure it's 2.4GHz WiFi (not 5GHz)");
    Serial.println("   4. Try moving ESP32 closer to router");
    Serial.println("========================================\n");
    Serial.println("⚠️  Continuing without WiFi...\n");
  }
}

void resetI2CBus() {
  Serial.println("🔄 Resetting I2C bus...");

  // End current I2C connection
  Wire.end();
  delay(100);

  // Reinitialize I2C
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);  // 100kHz for reliability
  delay(100);

  Serial.println("   ✅ I2C bus reset complete");

  // Reset failure counter
  i2cFailureCount = 0;
}

void scanI2C() {
  Serial.println("\n\n========================================");
  Serial.println("🔍 I2C BUS SCAN");
  Serial.println("========================================");
  byte error, address;
  int nDevices = 0;

  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.println("\n>>> DEVICE FOUND <<<");
      Serial.printf(">>> Address: 0x%02X\n", address);
      if (address == 0x76 || address == 0x77) {
        Serial.println(">>> This is BME680!");
      }
      if (address == 0x57) {
        Serial.println(">>> This is MAX30102!");
      }
      Serial.println();
      nDevices++;
    }
  }

  Serial.println("========================================");
  if (nDevices == 0) {
    Serial.println("❌❌❌ NO I2C DEVICES FOUND! ❌❌❌");
    Serial.println("========================================");
    Serial.println("WIRING CHECK FOR ESP32-S3:");
    Serial.printf("   SDA → GPIO %d\n", I2C_SDA);
    Serial.printf("   SCL → GPIO %d\n", I2C_SCL);
    Serial.println("   VCC → 3.3V");
    Serial.println("   GND → GND");
    Serial.println("========================================\n");
    Serial.println("⚠️  PLEASE FIX WIRING BEFORE CONTINUING\n");
    Serial.println("========================================\n\n");
  } else {
    Serial.printf("✅✅✅ FOUND %d DEVICE(S) ✅✅✅\n", nDevices);
    Serial.println("========================================\n\n");
  }
}

void setupSensors() {
  Serial.println("\n🔧 Initializing sensors...");

  // Scan I2C bus first
  scanI2C();

  // Add delay to let I2C bus stabilize after scan
  delay(200);

  // Initialize BME680 with retry
  Serial.print("\n   BME680: ");
  bool bmeInitialized = false;
  for (int attempt = 0; attempt < 3; attempt++) {
    if (bme.begin(0x76) || bme.begin(0x77)) {
      Serial.println("✅ OK");
      bmeInitialized = true;

      // Configure BME680
      bme.setTemperatureOversampling(BME680_OS_8X);
      bme.setHumidityOversampling(BME680_OS_2X);
      bme.setPressureOversampling(BME680_OS_4X);
      bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
      bme.setGasHeater(320, 150); // 320°C for 150 ms
      break;
    } else {
      if (attempt < 2) {
        Serial.printf("retry %d...", attempt + 2);
        delay(500);
      }
    }
  }

  if (!bmeInitialized) {
    Serial.println("❌ Not found (check I2C address: 0x76 or 0x77)");
    Serial.println("      TROUBLESHOOTING:");
    Serial.println("      1. Check wiring - VCC to 3.3V, GND to GND");
    Serial.println("      2. Check SDA/SCL connections (GPIO 21/22)");
    Serial.println("      3. Try connecting BME680 alone first");
  }

  delay(200);  // Delay before next sensor

  // Initialize MAX30102 with retry
  Serial.print("   MAX30102: ");
  bool maxInitialized = false;
  for (int attempt = 0; attempt < 3; attempt++) {
    if (particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
      Serial.println("✅ OK");
      maxInitialized = true;

      // Configure MAX30102 with explicit settings
      byte ledBrightness = 0x1F;  // 0x00 = off, 0xFF = max (try 0x1F = ~12%)
      byte sampleAverage = 4;     // Average 4 samples
      byte ledMode = 2;           // 2 = Red LED only (SpO2)
      int sampleRate = 100;       // 100 samples per second
      int pulseWidth = 411;       // 411 µs pulse width
      int adcRange = 4096;        // 4096 (15.63pA per LSB)

      particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);

      // Turn on Red LED to indicate sensor is active
      particleSensor.setPulseAmplitudeRed(0x1F);  // Brighter LED
      particleSensor.setPulseAmplitudeGreen(0);   // Turn off Green LED

      Serial.println("      🔴 Red LED should be ON now!");
      Serial.println("      Place finger on sensor to test");
      break;
    } else {
      if (attempt < 2) {
        Serial.printf("retry %d...", attempt + 2);
        delay(500);
      }
    }
  }

  if (!maxInitialized) {
    Serial.println("❌ Not found");
    Serial.println("      Expected I2C address: 0x57");
    Serial.println("      Check wiring and power (3.3V)");
  }
}

bool readBME680(float &temp, float &humidity, float &gasResistance) {
  if (!bme.performReading()) {
    Serial.println("   ❌ BME680 reading failed");
    return false;
  }

  temp = bme.temperature;
  humidity = bme.humidity;
  gasResistance = bme.gas_resistance / 1000.0; // Convert to kOhms

  Serial.printf("   🌡️  Temp: %.1f°C | 💧 Humid: %.1f%% | ⚗️  Gas: %.1f kΩ\n",
                temp, humidity, gasResistance);

  return true;
}

bool readMAX30102(float &heartRate, float &spo2) {
  // Note: This is a simplified reading
  // For production, implement proper PPG signal processing

  long irValue = particleSensor.getIR();

  if (irValue < 50000) {
    Serial.println("   ⚠️  No finger detected on MAX30102");
    return false;
  }

  // Placeholder values - implement proper heart rate algorithm
  // In production, use proper PPG analysis
  heartRate = 75.0 + random(-10, 10);
  spo2 = 97.0 + random(-2, 2);

  Serial.printf("   ❤️  HR: %.0f bpm | 🫁 SpO2: %.0f%%\n", heartRate, spo2);

  return true;
}

float readEMG() {
  // Read analog value from EMG sensor
  int rawValue = analogRead(EMG_PIN);

  // Check if sensor is connected
  // Floating pin typically reads extreme values (very low or very high)
  // or has very high variance
  static int consecutiveExtremeReads = 0;

  // If reading is suspiciously at the extremes, sensor might be disconnected
  if (rawValue < 50 || rawValue > 4000) {
    consecutiveExtremeReads++;
    if (consecutiveExtremeReads > 20) {
      // Likely disconnected - return -1 to indicate no sensor
      return -1;
    }
  } else {
    consecutiveExtremeReads = 0;  // Reset counter on normal reading
  }

  // Add to circular buffer
  emgBuffer[emgBufferIndex] = rawValue;
  emgBufferIndex = (emgBufferIndex + 1) % EMG_SAMPLES;
  if (!emgBufferFilled && emgBufferIndex == 0) {
    emgBufferFilled = true;
  }

  // Calculate moving average
  int sum = 0;
  int count = emgBufferFilled ? EMG_SAMPLES : emgBufferIndex;
  for (int i = 0; i < count; i++) {
    sum += emgBuffer[i];
  }
  float average = (float)sum / count;

  // Convert to normalized value (0-100 scale)
  float normalized = (average / 4095.0) * 100.0;

  // Note: We don't print here anymore since we're sampling at 50 Hz
  // Stats are printed in the main loop every 4 seconds

  return normalized;
}

void sendSensorData(float temp, float humidity, float gas, float hr, float spo2, float emg) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("   ⚠️  WiFi not connected, skipping upload");
    return;
  }

  HTTPClient http;

  // Prepare JSON payload
  JsonDocument doc;

  if (temp >= 0) doc["temperature"] = temp;
  if (humidity >= 0) doc["humidity"] = humidity;
  if (gas >= 0) {
    doc["gas_resistance"] = gas;
    doc["menthone_resistance"] = gas;
  }
  if (hr >= 0) doc["heart_rate"] = hr;
  if (spo2 >= 0) doc["spo2"] = spo2;
  if (emg >= 0) doc["emg_signal"] = emg;

  doc["device_id"] = "ESP32_" + deviceId;
  doc["battery_level"] = getBatteryLevel();

  // Map WiFi signal strength to 0-100 and constrain
  int signalQuality = map(WiFi.RSSI(), -100, -50, 0, 100);
  doc["signal_quality"] = constrain(signalQuality, 0, 100);

  String jsonString;
  serializeJson(doc, jsonString);

  // Send HTTP POST
  String url = String(API_URL) + "/api/v1/sensor-data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(API_TOKEN));

  Serial.printf("   📤 Sending to: %s\n", url.c_str());

  int httpCode = http.POST(jsonString);

  if (httpCode > 0) {
    if (httpCode == 201) {
      Serial.println("   ✅ Data sent successfully!");
    } else {
      Serial.printf("   ⚠️  Server response: %d\n", httpCode);
      Serial.printf("   Response: %s\n", http.getString().c_str());
    }
  } else {
    Serial.printf("   ❌ HTTP Error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

float getBatteryLevel() {
  // Read battery voltage from ADC (if connected)
  int adcValue = analogRead(34); // GPIO34 for battery monitoring
  float voltage = (adcValue / 4095.0) * 3.3 * 2.0;

  // Convert to percentage (3.0V min, 4.2V max for LiPo)
  float percentage = ((voltage - 3.0) / (4.2 - 3.0)) * 100.0;
  percentage = constrain(percentage, 0, 100);

  return percentage;
}
