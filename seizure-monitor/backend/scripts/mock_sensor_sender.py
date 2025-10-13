#!/usr/bin/env python3
"""
Mock Sensor Data Sender
Simulates ESP32 sending sensor data to the backend API
Useful for testing without physical hardware
"""

import requests
import time
import random
import math
from datetime import datetime
import argparse
import json


class MockSensorDevice:
    """Simulates sensor readings from BME660 and MAX30102"""

    def __init__(self, base_hr=75, base_spo2=97, base_temp=25, base_humidity=50):
        self.base_hr = base_hr
        self.base_spo2 = base_spo2
        self.base_temp = base_temp
        self.base_humidity = base_humidity
        self.time_offset = 0

    def generate_reading(self):
        """Generate realistic sensor reading with some variation"""
        self.time_offset += 1

        # Heart rate with sine wave + noise (60-100 bpm typical)
        hr = self.base_hr + math.sin(self.time_offset / 10) * 10 + random.uniform(-3, 3)
        hr = max(50, min(120, hr))  # Clamp to reasonable range

        # SpO2 (95-100% typical)
        spo2 = self.base_spo2 + random.uniform(-1, 1)
        spo2 = max(90, min(100, spo2))

        # Temperature (20-30°C typical)
        temp = self.base_temp + math.sin(self.time_offset / 20) * 2 + random.uniform(-0.5, 0.5)

        # Humidity (40-60% typical)
        humidity = self.base_humidity + math.sin(self.time_offset / 15) * 5 + random.uniform(-2, 2)
        humidity = max(20, min(80, humidity))

        # Gas resistance (BME660) - varies with VOC presence
        # Higher resistance = cleaner air
        gas_resistance = 100 + math.sin(self.time_offset / 30) * 30 + random.uniform(-10, 10)
        gas_resistance = max(50, gas_resistance)

        # Menthone resistance (simulated VOC sensor reading)
        # Lower values indicate detection
        menthone = gas_resistance + random.uniform(-5, 5)

        # EMG level (muscle activity)
        emg = 50 + math.sin(self.time_offset / 5) * 20 + random.uniform(-5, 5)
        emg = max(0, emg)

        # Battery level (slowly decreasing)
        battery = 100 - (self.time_offset * 0.01) % 100

        # Signal quality (mostly good, occasional drops)
        signal_quality = 95 if random.random() > 0.1 else random.uniform(60, 85)

        return {
            "heart_rate": round(hr, 1),
            "spo2": round(spo2, 1),
            "temperature": round(temp, 1),
            "humidity": round(humidity, 1),
            "gas_resistance": round(gas_resistance, 1),
            "menthone_resistance": round(menthone, 1),
            "emg_level": round(emg, 1),
            "device_id": "ESP32_MOCK_001",
            "battery_level": round(battery, 1),
            "signal_quality": round(signal_quality, 1),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }


def send_sensor_data(api_url, token, reading):
    """Send sensor reading to the API"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        f"{api_url}/api/v1/sensor-data",
        headers=headers,
        json=reading
    )

    return response


def authenticate(api_url, email, password):
    """Authenticate and get access token"""
    response = requests.post(
        f"{api_url}/api/v1/auth/login",
        json={"email": email, "password": password}
    )

    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    else:
        raise Exception(f"Authentication failed: {response.text}")


def main():
    parser = argparse.ArgumentParser(description="Mock sensor data sender")
    parser.add_argument("--api-url", default="http://localhost:8000",
                        help="Backend API URL")
    parser.add_argument("--email", required=True,
                        help="User email for authentication")
    parser.add_argument("--password", required=True,
                        help="User password")
    parser.add_argument("--interval", type=int, default=4,
                        help="Seconds between readings (default: 4)")
    parser.add_argument("--duration", type=int, default=0,
                        help="Duration in seconds (0 = infinite)")
    parser.add_argument("--batch", action="store_true",
                        help="Send data in batches instead of individual readings")
    parser.add_argument("--batch-size", type=int, default=10,
                        help="Number of readings per batch")

    args = parser.parse_args()

    print(f"🔐 Authenticating as {args.email}...")
    try:
        token = authenticate(args.api_url, args.email, args.password)
        print(f"✅ Authentication successful!")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return

    sensor = MockSensorDevice()
    start_time = time.time()
    reading_count = 0
    batch_buffer = []

    print(f"\n📡 Starting mock sensor transmission...")
    print(f"   Interval: {args.interval}s")
    print(f"   Batch mode: {'Yes' if args.batch else 'No'}")
    if args.duration > 0:
        print(f"   Duration: {args.duration}s")
    print(f"   Press Ctrl+C to stop\n")

    try:
        while True:
            # Check duration limit
            if args.duration > 0 and (time.time() - start_time) >= args.duration:
                print(f"\n⏰ Duration limit reached. Stopping...")
                break

            # Generate reading
            reading = sensor.generate_reading()
            reading_count += 1

            if args.batch:
                # Batch mode
                batch_buffer.append(reading)

                if len(batch_buffer) >= args.batch_size:
                    try:
                        response = requests.post(
                            f"{args.api_url}/api/v1/sensor-data/batch",
                            headers={
                                "Authorization": f"Bearer {token}",
                                "Content-Type": "application/json"
                            },
                            json={"readings": batch_buffer}
                        )

                        if response.status_code == 201:
                            print(f"✅ [{reading_count}] Sent batch of {len(batch_buffer)} readings")
                        else:
                            print(f"❌ [{reading_count}] Failed: {response.status_code} - {response.text}")

                        batch_buffer = []
                    except Exception as e:
                        print(f"❌ [{reading_count}] Error: {e}")
            else:
                # Individual mode
                try:
                    response = send_sensor_data(args.api_url, token, reading)

                    if response.status_code == 201:
                        print(f"✅ [{reading_count}] HR: {reading['heart_rate']} bpm | "
                              f"SpO2: {reading['spo2']}% | "
                              f"Temp: {reading['temperature']}°C | "
                              f"Battery: {reading['battery_level']}%")
                    else:
                        print(f"❌ [{reading_count}] Failed: {response.status_code} - {response.text}")
                except Exception as e:
                    print(f"❌ [{reading_count}] Error: {e}")

            time.sleep(args.interval)

    except KeyboardInterrupt:
        print(f"\n\n⏹️  Stopped by user")
        print(f"📊 Total readings sent: {reading_count}")
        print(f"⏱️  Total duration: {int(time.time() - start_time)}s")


if __name__ == "__main__":
    main()
