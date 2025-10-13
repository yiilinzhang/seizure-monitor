// Minimal I2C Scanner Test
// Upload this to test if I2C bus is working at all

#include <Wire.h>

#define I2C_SDA 21
#define I2C_SCL 22

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n\n=== MINIMAL I2C SCANNER TEST ===\n");

  // Initialize I2C
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(100000);  // 100kHz

  Serial.println("I2C initialized on:");
  Serial.println("  SDA = GPIO 21");
  Serial.println("  SCL = GPIO 22");
  Serial.println("  Speed = 100kHz\n");
}

void loop() {
  Serial.println("Scanning I2C bus...");

  byte error, address;
  int nDevices = 0;

  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.printf("  FOUND device at address 0x%02X\n", address);

      // Identify common sensors
      if (address == 0x76 || address == 0x77) {
        Serial.println("    → This is BME680!");
      }
      if (address == 0x57) {
        Serial.println("    → This is MAX30102!");
      }

      nDevices++;
    }
    else if (error == 4) {
      Serial.printf("  ERROR at address 0x%02X\n", address);
    }
  }

  if (nDevices == 0) {
    Serial.println("\n❌ NO DEVICES FOUND!");
    Serial.println("\nTROUBLESHOOTING:");
    Serial.println("1. Check ALL wires are connected:");
    Serial.println("   - VCC → 3.3V");
    Serial.println("   - GND → GND");
    Serial.println("   - SDA → GPIO 21");
    Serial.println("   - SCL → GPIO 22");
    Serial.println("2. Push wires FIRMLY into breadboard");
    Serial.println("3. Try different breadboard rows");
    Serial.println("4. Check sensor has power (LED on?)");
  }
  else {
    Serial.printf("\n✅ Found %d device(s)\n", nDevices);
  }

  Serial.println("\n--- Scanning again in 5 seconds ---\n");
  delay(5000);
}
