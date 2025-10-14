#!/usr/bin/env python3
"""
Add fake emergency events (seizures) to history for mocktest@example.com
This will show up in the History page with red dots
"""

import sqlite3
import uuid
from datetime import datetime, timedelta
import random

# Database connection
DB_PATH = "seizure_monitor.db"
USER_ID = "db1c771f-c848-45fb-bcc7-95aaaf0524b4"  # mocktest@example.com

# Singapore coordinates (default location)
DEFAULT_LAT = 1.3521
DEFAULT_LNG = 103.8198

def add_emergency_events():
    """Add several emergency events across different dates"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Clear existing events for this user
    cursor.execute("DELETE FROM emergency_events WHERE user_id = ?", (USER_ID,))
    print(f"Cleared existing events for user {USER_ID}")

    now = datetime.utcnow()
    events = []

    # Event 1: 2 days ago - morning seizure
    event_time_1 = now - timedelta(days=2, hours=8, minutes=30)
    events.append({
        'id': f"event_{int(event_time_1.timestamp())}",
        'user_id': USER_ID,
        'location_lat': DEFAULT_LAT + random.uniform(-0.01, 0.01),
        'location_lng': DEFAULT_LNG + random.uniform(-0.01, 0.01),
        'delta_pct': round(random.uniform(45.0, 65.0), 1),  # High menthone spike
        'timestamp': int(event_time_1.timestamp()),
        'triggered_at': event_time_1.isoformat()
    })

    # Event 2: 5 days ago - evening seizure
    event_time_2 = now - timedelta(days=5, hours=19, minutes=15)
    events.append({
        'id': f"event_{int(event_time_2.timestamp())}",
        'user_id': USER_ID,
        'location_lat': DEFAULT_LAT + random.uniform(-0.01, 0.01),
        'location_lng': DEFAULT_LNG + random.uniform(-0.01, 0.01),
        'delta_pct': round(random.uniform(38.0, 55.0), 1),
        'timestamp': int(event_time_2.timestamp()),
        'triggered_at': event_time_2.isoformat()
    })

    # Event 3: 7 days ago - afternoon seizure
    event_time_3 = now - timedelta(days=7, hours=14, minutes=45)
    events.append({
        'id': f"event_{int(event_time_3.timestamp())}",
        'user_id': USER_ID,
        'location_lat': DEFAULT_LAT + random.uniform(-0.01, 0.01),
        'location_lng': DEFAULT_LNG + random.uniform(-0.01, 0.01),
        'delta_pct': round(random.uniform(40.0, 58.0), 1),
        'timestamp': int(event_time_3.timestamp()),
        'triggered_at': event_time_3.isoformat()
    })

    # Event 4: 12 days ago - late night seizure
    event_time_4 = now - timedelta(days=12, hours=23, minutes=20)
    events.append({
        'id': f"event_{int(event_time_4.timestamp())}",
        'user_id': USER_ID,
        'location_lat': DEFAULT_LAT + random.uniform(-0.01, 0.01),
        'location_lng': DEFAULT_LNG + random.uniform(-0.01, 0.01),
        'delta_pct': round(random.uniform(42.0, 60.0), 1),
        'timestamp': int(event_time_4.timestamp()),
        'triggered_at': event_time_4.isoformat()
    })

    # Event 5: 18 days ago - morning seizure
    event_time_5 = now - timedelta(days=18, hours=7, minutes=10)
    events.append({
        'id': f"event_{int(event_time_5.timestamp())}",
        'user_id': USER_ID,
        'location_lat': DEFAULT_LAT + random.uniform(-0.01, 0.01),
        'location_lng': DEFAULT_LNG + random.uniform(-0.01, 0.01),
        'delta_pct': round(random.uniform(35.0, 52.0), 1),
        'timestamp': int(event_time_5.timestamp()),
        'triggered_at': event_time_5.isoformat()
    })

    # Event 6: 25 days ago - afternoon seizure
    event_time_6 = now - timedelta(days=25, hours=15, minutes=30)
    events.append({
        'id': f"event_{int(event_time_6.timestamp())}",
        'user_id': USER_ID,
        'location_lat': DEFAULT_LAT + random.uniform(-0.01, 0.01),
        'location_lng': DEFAULT_LNG + random.uniform(-0.01, 0.01),
        'delta_pct': round(random.uniform(38.0, 56.0), 1),
        'timestamp': int(event_time_6.timestamp()),
        'triggered_at': event_time_6.isoformat()
    })

    # Insert all events
    insert_query = """
        INSERT INTO emergency_events (
            id, user_id, location_lat, location_lng, delta_pct, timestamp, triggered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """

    for event in events:
        cursor.execute(insert_query, (
            event['id'],
            event['user_id'],
            event['location_lat'],
            event['location_lng'],
            event['delta_pct'],
            event['timestamp'],
            event['triggered_at']
        ))
        print(f"✅ Added event: {event['triggered_at']} - Delta: {event['delta_pct']}%")

    conn.commit()
    conn.close()

    print(f"\n🎉 Successfully added {len(events)} emergency events!")
    print("These will appear in the History page with red dots")

if __name__ == "__main__":
    add_emergency_events()
