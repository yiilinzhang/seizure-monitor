#!/usr/bin/env python3
"""
Generate fake sensor data and send it to the API
This simulates the ESP32 hardware sending sensor readings
"""

import asyncio
import httpx
import random
import time
from datetime import datetime

# API Configuration
API_URL = "http://localhost:8000"
API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNmNkMmI1MC0xYzMwLTRkNTgtYmEzNS1jNGU2OTU3NzQ1MTgiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwiZXhwIjoxNzYwNTQzNDI2LCJpYXQiOjE3NjA0NTcwMjZ9.KJdukBU15oPV5k62rOXjVVcusOmRK0l9I2BRRqNTrXk"  # test@gmail.com

# Sensor ranges for realistic mock data
HEART_RATE_RANGE = (60, 100)  # bpm
SPO2_RANGE = (95, 100)  # percentage
TEMPERATURE_RANGE = (36.0, 37.5)  # Celsius
HUMIDITY_RANGE = (30.0, 70.0)  # percentage
GAS_RESISTANCE_RANGE = (50.0, 200.0)  # kOhms
EMG_RANGE = (100, 3000)  # raw ADC value
BATTERY_RANGE = (80, 100)  # percentage


def generate_sensor_reading():
    """Generate a realistic sensor reading"""
    return {
        "heart_rate": round(random.uniform(*HEART_RATE_RANGE), 1),
        "spo2": round(random.uniform(*SPO2_RANGE), 1),
        "temperature": round(random.uniform(*TEMPERATURE_RANGE), 2),
        "humidity": round(random.uniform(*HUMIDITY_RANGE), 1),
        "gas_resistance": round(random.uniform(*GAS_RESISTANCE_RANGE), 1),
        "menthone_resistance": round(random.uniform(*GAS_RESISTANCE_RANGE), 1),
        "emg_signal": round(random.uniform(*EMG_RANGE), 0),
        "device_id": "FAKE_SENSOR_01",
        "battery_level": round(random.uniform(*BATTERY_RANGE), 1),
        "signal_quality": random.randint(80, 100),
    }


async def send_sensor_data(reading):
    """Send sensor data to the API"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_TOKEN}"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{API_URL}/api/v1/sensor-data",
                json=reading,
                headers=headers,
                timeout=10.0
            )

            if response.status_code == 201:
                print(f"✅ Data sent successfully: HR={reading['heart_rate']}, SpO2={reading['spo2']}%")
            else:
                print(f"❌ Error {response.status_code}: {response.text}")

        except Exception as e:
            print(f"❌ Failed to send data: {e}")


async def generate_continuous_data(interval_seconds=4):
    """Continuously generate and send fake sensor data"""
    print(f"🚀 Starting fake sensor data generator")
    print(f"📊 Sending data every {interval_seconds} seconds")
    print(f"🔗 API: {API_URL}")
    print(f"⏸️  Press Ctrl+C to stop\n")

    try:
        while True:
            reading = generate_sensor_reading()
            await send_sensor_data(reading)
            await asyncio.sleep(interval_seconds)

    except KeyboardInterrupt:
        print("\n\n⏹️  Stopping fake sensor data generator")


if __name__ == "__main__":
    asyncio.run(generate_continuous_data())
