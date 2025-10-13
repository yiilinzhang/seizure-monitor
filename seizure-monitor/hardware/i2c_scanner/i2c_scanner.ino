/**
 * I2C Scanner - Find connected I2C devices
 * This will show which addresses respond
 */

#include <Wire.h>

#define I2C_SDA 21
#define I2C_SCL 22

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n\n=== I2C Scanner ===");
  Serial.println("Scanning for I2C devices...\n");

  Wire.begin(I2C_SDA, I2C_SCL);
}

void loop() {
  byte error, address;
  int nDevices = 0;

  Serial.println("Scanning...");

  for(address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.print(" (");
      Serial.print(address);
      Serial.println(")");

      // Identify common sensors
      if (address == 0x76 || address == 0x77) {
        Serial.println("  -> Likely BME680 sensor!");
      }
      if (address == 0x57) {
        Serial.println("  -> Likely MAX30102 sensor!");
      }

      nDevices++;
    }
    else if (error == 4) {
      Serial.print("Unknown error at address 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
    }
  }

  if (nDevices == 0) {
    Serial.println("No I2C devices found!\n");
    Serial.println("CHECK:");
    Serial.println("  - Wiring: SDA->GPIO21, SCL->GPIO22");
    Serial.println("  - Power: 3.3V (NOT 5V!)");
    Serial.println("  - Connections are secure");
  }
  else {
    Serial.print("\nFound ");
    Serial.print(nDevices);
    Serial.println(" device(s)\n");
  }

  delay(5000); // Scan every 5 seconds
}
