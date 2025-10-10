#!/bin/bash

echo "🚀 Starting Seizure Monitor App..."

# Kill any existing processes
killall -9 node 2>/dev/null
killall -9 xcodebuild 2>/dev/null
killall -9 clang 2>/dev/null

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf ~/Library/Developer/Xcode/DerivedData/SeizureMonitor-*
cd ios
xcodebuild clean -quiet

# Start Metro in background
echo "📦 Starting Metro bundler..."
cd ..
npx react-native start --reset-cache &
METRO_PID=$!
sleep 5

# Open simulator
echo "📱 Opening simulator..."
open -a Simulator

# Build and run the app
echo "🔨 Building and running app..."
cd ios
xcodebuild -workspace SeizureMonitor.xcworkspace \
  -scheme SeizureMonitor \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  | xcbeautify

echo "✅ App should be running now!"