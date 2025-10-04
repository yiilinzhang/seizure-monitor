#!/bin/bash

echo "🚀 Seizure Detection System Launcher"
echo "===================================="
echo ""

if [ "$1" = "backend" ] || [ "$1" = "api" ]; then
    echo "Starting FastAPI backend..."
    cd backend
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -q -r requirements.txt
    echo "✅ Backend running at http://localhost:8000"
    echo "📚 API docs at http://localhost:8000/docs"
    uvicorn app.main:app --reload

elif [ "$1" = "mobile" ] || [ "$1" = "app" ]; then
    echo "Starting React Native mobile app..."
    cd mobile

    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    if [ "$2" = "ios" ]; then
        echo "Starting iOS app..."
        npm run ios
    elif [ "$2" = "android" ]; then
        echo "Starting Android app..."
        npm run android
    else
        echo "Starting Metro bundler..."
        npx react-native start
    fi

elif [ "$1" = "install" ]; then
    echo "Installing all dependencies..."

    echo "📦 Installing backend dependencies..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..

    echo "📦 Installing mobile app dependencies..."
    cd mobile
    npm install

    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "📦 Installing iOS dependencies..."
        cd ios && pod install && cd ..
    fi

    echo "✅ Installation complete!"

else
    echo "Usage:"
    echo "  ./start.sh backend           # Start FastAPI backend"
    echo "  ./start.sh mobile            # Start React Native Metro"
    echo "  ./start.sh mobile ios        # Start iOS app"
    echo "  ./start.sh mobile android    # Start Android app"
    echo "  ./start.sh install           # Install all dependencies"
    echo ""
    echo "Quick start:"
    echo "  1. Run './start.sh install' first"
    echo "  2. In one terminal: './start.sh backend'"
    echo "  3. In another terminal: './start.sh mobile ios'"
fi