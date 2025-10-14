#!/usr/bin/env python3
"""
Populate historical sensor data for mocktest@example.com
Creates 24 hours of data with a seizure event pattern
"""

import sqlite3
import uuid
from datetime import datetime, timedelta
import random
import math

# Database connection
DB_PATH = "seizure_monitor.db"
USER_ID = "db1c771f-c848-45fb-bcc7-95aaaf0524b4"  # mocktest@example.com

# Sensor ranges for realistic data
HEART_RATE_BASE = 75
SPO2_BASE = 97
TEMPERATURE_BASE = 36.8
HUMIDITY_BASE = 50
GAS_RESISTANCE_BASE = 100
MENTHONE_BASE = 100
EMG_BASE = 500
BATTERY_LEVEL = 85
SIGNAL_QUALITY = 95

def generate_sensor_reading(timestamp, hours_ago, seizure_event=False):
    """Generate a sensor reading with optional seizure pattern"""

    # Add some natural variation
    hr_variation = random.uniform(-5, 5)
    spo2_variation = random.uniform(-2, 2)
    temp_variation = random.uniform(-0.3, 0.3)

    # Normal baseline with circadian rhythm
    time_factor = math.sin(hours_ago * math.pi / 12)  # 24-hour cycle

    if seizure_event:
        # Seizure pattern: elevated heart rate, decreased SpO2, increased menthone
        heart_rate = HEART_RATE_BASE + 30 + random.uniform(5, 15)
        spo2 = SPO2_BASE - random.uniform(3, 7)
        menthone = MENTHONE_BASE + random.uniform(40, 60)  # Significant spike
        emg = EMG_BASE + random.uniform(800, 1200)  # High muscle activity
    else:
        # Normal readings with daily variation
        heart_rate = HEART_RATE_BASE + hr_variation + (time_factor * 5)
        spo2 = SPO2_BASE + spo2_variation
        menthone = MENTHONE_BASE + random.uniform(-10, 10) + (time_factor * 5)
        emg = EMG_BASE + random.uniform(-100, 100)

    temperature = TEMPERATURE_BASE + temp_variation
    humidity = HUMIDITY_BASE + random.uniform(-5, 5)
    gas_resistance = GAS_RESISTANCE_BASE + random.uniform(-10, 10)

    return {
        'id': str(uuid.uuid4()),
        'user_id': USER_ID,
        'timestamp': timestamp.isoformat(),
        'heart_rate': round(heart_rate, 1),
        'spo2': round(spo2, 1),
        'temperature': round(temperature, 2),
        'humidity': round(humidity, 1),
        'gas_resistance': round(gas_resistance, 1),
        'menthone_resistance': round(menthone, 1),
        'emg_level': round(emg, 0),
        'device_id': 'MOCK_DEVICE_01',
        'battery_level': BATTERY_LEVEL,
        'signal_quality': SIGNAL_QUALITY
    }

def populate_history():
    """Populate 24 hours of historical data with a seizure event"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Clear existing data for this user
    cursor.execute("DELETE FROM sensor_readings WHERE user_id = ?", (USER_ID,))
    print(f"Cleared existing data for user {USER_ID}")

    # Generate data points every 2 minutes for 24 hours
    now = datetime.utcnow()
    data_points = []

    # Seizure event occurred 6 hours ago, lasted ~5 minutes
    seizure_start_hours = 6
    seizure_duration_minutes = 5

    for minutes_ago in range(0, 24 * 60, 2):  # Every 2 minutes for 24 hours
        hours_ago = minutes_ago / 60
        timestamp = now - timedelta(minutes=minutes_ago)

        # Determine if this is during the seizure event
        seizure_window = (
            hours_ago >= seizure_start_hours - 0.1 and
            hours_ago <= seizure_start_hours + (seizure_duration_minutes / 60)
        )

        reading = generate_sensor_reading(timestamp, hours_ago, seizure_event=seizure_window)
        data_points.append(reading)

    # Insert all data points
    insert_query = """
        INSERT INTO sensor_readings (
            id, user_id, timestamp, heart_rate, spo2, temperature, humidity,
            gas_resistance, menthone_resistance, emg_level, device_id,
            battery_level, signal_quality
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    for reading in data_points:
        cursor.execute(insert_query, (
            reading['id'],
            reading['user_id'],
            reading['timestamp'],
            reading['heart_rate'],
            reading['spo2'],
            reading['temperature'],
            reading['humidity'],
            reading['gas_resistance'],
            reading['menthone_resistance'],
            reading['emg_level'],
            reading['device_id'],
            reading['battery_level'],
            reading['signal_quality']
        ))

    conn.commit()
    conn.close()

    print(f"✅ Successfully populated {len(data_points)} sensor readings")
    print(f"📊 Data range: {data_points[-1]['timestamp']} to {data_points[0]['timestamp']}")
    print(f"🚨 Seizure event simulated ~6 hours ago")

if __name__ == "__main__":
    populate_history()
