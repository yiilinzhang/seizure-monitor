#!/bin/bash

echo "=== Testing Authentication Flow ==="
echo ""

# Login
echo "1. Logging in as mocktest@example.com..."
LOGIN_RESPONSE=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mocktest@example.com","password":"password123"}' \
  -s)

echo "Login response:"
echo "$LOGIN_RESPONSE" | python3 -m json.tool
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:50}..."
echo ""

# Test sensor data endpoint
echo "2. Testing /sensor-data/latest with token..."
SENSOR_RESPONSE=$(curl -X GET http://localhost:8000/api/v1/sensor-data/latest \
  -H "Authorization: Bearer $TOKEN" \
  -s)

echo "Sensor data response:"
echo "$SENSOR_RESPONSE" | python3 -m json.tool
echo ""

# Check if we got data
MENTHONE=$(echo "$SENSOR_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('menthone_resistance', 'NONE'))" 2>/dev/null)

if [ "$MENTHONE" != "NONE" ] && [ ! -z "$MENTHONE" ]; then
  echo "✅ SUCCESS: Got menthone data: $MENTHONE%"
else
  echo "❌ FAILED: No menthone data received"
  echo "Response was: $SENSOR_RESPONSE"
fi
