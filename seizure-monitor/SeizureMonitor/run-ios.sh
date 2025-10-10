#!/bin/bash
# Bypass RVM and use system tools directly

cd /Users/yilinzhang/Documents/seizure_monitor\ 2/seizure-monitor/SeizureMonitor

# Start Metro bundler if not running
npx react-native start &
METRO_PID=$!
sleep 5

# Build and run iOS app
cd ios
xcodebuild -workspace SeizureMonitor.xcworkspace \
  -scheme SeizureMonitor \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build

# Install app to simulator
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/SeizureMonitor.app

# Launch the app
xcrun simctl launch booted com.seizuremonitor

echo "App launched successfully!"