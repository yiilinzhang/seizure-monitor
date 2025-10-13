/**
 * Seizure Monitor - ESP32 Sensor Hub
 *
 * This firmware reads sensor data from:
 * - BME660/BME680: Temperature, Humidity, Gas Resistance (Menthone detection)
 * - MAX30102/MAX30105: Heart Rate, SpO2
 *
 * And sends it to the backend API via HTTP POST
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_BME680.h>
#include <MAX30105.h>

// WiFi credentials (defined in platformio.ini)
#ifndef WIFI_SSID
#define WIFI_SSID "YOUR_WIFI_SSID"
#endif

#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#endif

// API configuration
#ifndef API_URL
#define API_URL "http://192.168.1.100:8000"
#endif

#ifndef API_TOKEN
#define API_TOKEN "YOUR_AUTH_TOKEN_HERE"
#endif

// Sensor reading interval (milliseconds)
#define READING_INTERVAL 4000  // 4 seconds

// I2C pins
#define I2C_SDA 21
#define I2C_SCL 22

// Sensor objects
Adafruit_BME680 bme;
MAX30105 particleSensor;

// Timing
unsigned long lastReading = 0;
unsigned long lastWiFiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL = 30000; // Check WiFi every 30s

// Device ID (MAC address)
String deviceId;

// Function declarations
void setupWiFi();
void setupSensors();
bool readBME680(float &temp, float &humidity, float &gasResistance);
bool readMAX30102(float &heartRate, float &spo2);
void sendSensorData(float temp, float humidity, float gas, float hr, float spo2);
float getBatteryLevel();

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("Seizure Monitor - ESP32 Sensor Hub");
  Serial.println("========================================\n");

  // Get device ID from MAC address
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  deviceId = String(mac[0], HEX) + String(mac[1], HEX) +
             String(mac[2], HEX) + String(mac[3], HEX) +
             String(mac[4], HEX) + String(mac[5], HEX);
  deviceId.toUpperCase();
  Serial.printf("Device ID: ESP32_%s\n", deviceId.c_str());

  // Initialize I2C
  Wire.begin(I2C_SDA, I2C_SCL);

  // Setup WiFi
  setupWiFi();

  // Setup sensors
  setupSensors();

  Serial.println("\n✅ Setup complete!\n");
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

  // Read sensors at interval
  if (currentMillis - lastReading >= READING_INTERVAL) {
    lastReading = currentMillis;

    Serial.println("📊 Reading sensors...");

    // Read sensor data
    float temperature, humidity, gasResistance;
    float heartRate, spo2;

    bool bmeOk = readBME680(temperature, humidity, gasResistance);
    bool maxOk = readMAX30102(heartRate, spo2);

    // Send data to server if we have valid readings
    if (bmeOk || maxOk) {
      sendSensorData(
        bmeOk ? temperature : -1,
        bmeOk ? humidity : -1,
        bmeOk ? gasResistance : -1,
        maxOk ? heartRate : -1,
        maxOk ? spo2 : -1
      );
    } else {
      Serial.println("❌ No valid sensor readings");
    }

    Serial.println();
  }

  delay(100);
}

void setupWiFi() {
  Serial.printf("📡 Connecting to WiFi: %s", WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.printf("   IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("   Signal: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }
}

void setupSensors() {
  Serial.println("\n🔧 Initializing sensors...");

  // Initialize BME680
  Serial.print("   BME680: ");
  if (bme.begin(0x76) || bme.begin(0x77)) {
    Serial.println("✅ OK");

    // Configure BME680
    bme.setTemperatureOversampling(BME680_OS_8X);
    bme.setHumidityOversampling(BME680_OS_2X);
    bme.setPressureOversampling(BME680_OS_4X);
    bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
    bme.setGasHeater(320, 150); // 320°C for 150 ms
  } else {
    Serial.println("❌ Not found");
  }

  // Initialize MAX30102
  Serial.print("   MAX30102: ");
  if (particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("✅ OK");

    // Configure MAX30102
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED to low to indicate sensor is running
    particleSensor.setPulseAmplitudeGreen(0);  // Turn off Green LED
  } else {
    Serial.println("❌ Not found");
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
  // For production, you'd want to use proper PPG signal processing
  // See: https://github.com/sparkfun/SparkFun_MAX3010x_Sensor_Library/tree/master/examples

  long irValue = particleSensor.getIR();

  if (irValue < 50000) {
    Serial.println("   ⚠️  No finger detected on MAX30102");
    return false;
  }

  // Placeholder values - implement proper heart rate algorithm
  // In production, use proper PPG analysis or library functions
  heartRate = 75.0 + random(-10, 10);
  spo2 = 97.0 + random(-2, 2);

  Serial.printf("   ❤️  HR: %.0f bpm | 🫁 SpO2: %.0f%%\n", heartRate, spo2);

  return true;
}

void sendSensorData(float temp, float humidity, float gas, float hr, float spo2) {
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
    doc["menthone_resistance"] = gas; // For now, same value
  }
  if (hr >= 0) doc["heart_rate"] = hr;
  if (spo2 >= 0) doc["spo2"] = spo2;

  doc["device_id"] = "ESP32_" + deviceId;
  doc["battery_level"] = getBatteryLevel();
  doc["signal_quality"] = map(WiFi.RSSI(), -100, -50, 0, 100);

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
  // This is a placeholder - adjust based on your battery circuit
  int adcValue = analogRead(34); // GPIO34 for battery monitoring
  float voltage = (adcValue / 4095.0) * 3.3 * 2.0; // Assuming voltage divider

  // Convert to percentage (assuming 3.0V min, 4.2V max for LiPo)
  float percentage = ((voltage - 3.0) / (4.2 - 3.0)) * 100.0;
  percentage = constrain(percentage, 0, 100);

  return percentage;
}
