// Test I2C Scanner with Multiple Pin Combinations
// This will try different GPIO pin combinations to find your I2C devices

#include <Wire.h>

// Different ESP32 boards use different I2C pins
// We'll try all common combinations
struct PinCombo {
  int sda;
  int scl;
  const char* description;
};

PinCombo pinCombos[] = {
  {21, 22, "Standard ESP32"},
  {8, 9, "ESP32-S3"},
  {33, 32, "Alternative pins"},
  {26, 25, "Another common combo"},
  {18, 19, "Yet another option"},
};

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n\n=========================================");
  Serial.println("MULTI-PIN I2C SCANNER");
  Serial.println("Testing different GPIO pin combinations");
  Serial.println("=========================================\n");

  for (int i = 0; i < 5; i++) {
    testPinCombo(pinCombos[i].sda, pinCombos[i].scl, pinCombos[i].description);
  }

  Serial.println("\n=========================================");
  Serial.println("SCAN COMPLETE!");
  Serial.println("=========================================\n");
  Serial.println("If you found a device above, use those pins in your code.\n");
  Serial.println("If NO devices found, check:");
  Serial.println("  1. Sensor power (VCC to 3.3V, GND to GND)");
  Serial.println("  2. Wires are fully inserted in breadboard");
  Serial.println("  3. Sensor is not broken");
  Serial.println("\nScanning again in 10 seconds...\n");
}

void loop() {
  delay(10000);
  setup();  // Run scan again
}

void testPinCombo(int sda, int scl, const char* desc) {
  Serial.println("-----------------------------------------");
  Serial.printf("Testing: %s\n", desc);
  Serial.printf("SDA = GPIO %d | SCL = GPIO %d\n", sda, scl);
  Serial.println("-----------------------------------------");

  // Initialize I2C with these pins
  Wire.end();  // End previous I2C connection
  Wire.begin(sda, scl);
  Wire.setClock(100000);  // 100kHz
  delay(100);

  // Scan for devices
  byte error, address;
  int nDevices = 0;

  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.println("\n🎉🎉🎉 DEVICE FOUND! 🎉🎉🎉");
      Serial.printf("Address: 0x%02X\n", address);

      // Identify common sensors
      if (address == 0x76 || address == 0x77) {
        Serial.println("This is BME680!");
      }
      if (address == 0x57) {
        Serial.println("This is MAX30102!");
      }

      Serial.printf("\n✅ USE THESE PINS IN YOUR CODE:\n");
      Serial.printf("   #define I2C_SDA %d\n", sda);
      Serial.printf("   #define I2C_SCL %d\n\n", scl);

      nDevices++;
    }
  }

  if (nDevices == 0) {
    Serial.println("❌ No devices found with these pins");
  } else {
    Serial.printf("✅ Found %d device(s) with these pins!\n", nDevices);
  }

  Serial.println();
  delay(200);
}
