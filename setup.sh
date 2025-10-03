#!/bin/bash

echo "🚀 Seizure Detection System Setup"
echo "================================="
echo ""

# Backend setup
echo "📦 Setting up FastAPI backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
echo "Installing Python packages..."
pip install -r requirements.txt

echo "✅ Backend setup complete!"
echo ""

# Mobile setup
echo "📱 Setting up React Native mobile app..."
cd ../mobile

# Check if we need to initialize React Native project
if [ ! -f "metro.config.js" ]; then
    echo "Initializing React Native project..."
    npx @react-native-community/cli@latest init SeizureDetector --template react-native-template-typescript --directory . --skip-install
fi

# Install dependencies
echo "Installing Node packages..."
npm install

# iOS setup (Mac only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -d "ios" ]; then
        echo "Setting up iOS dependencies..."
        cd ios && pod install && cd ..
    fi
fi

echo "✅ Mobile setup complete!"
echo ""

cd ..

echo "✨ Setup complete! Next steps:"
echo "1. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload"
echo ""
echo "2. Start the mobile app:"
echo "   cd mobile"
echo "   npx react-native start  # In one terminal"
echo "   npx react-native run-ios  # or run-android in another terminal"
echo ""
echo "3. Visit API docs at: http://localhost:8000/docs"