#!/bin/bash

echo "🚀 Starting Seizure Detection Backend"
echo "===================================="
echo ""

cd backend

# Remove old venv if exists
if [ -d "venv" ]; then
    echo "Removing old virtual environment..."
    rm -rf venv
fi

# Create new virtual environment
echo "Creating fresh virtual environment..."
python3 -m venv venv

# Activate venv
source venv/bin/activate

# Upgrade pip and install wheel first
echo "Upgrading pip..."
pip install --upgrade pip wheel setuptools

# Try different requirement files based on what works
echo "Installing packages..."

# First try the basic requirements
if pip install -r requirements-basic.txt; then
    echo "✅ Basic packages installed successfully!"
else
    echo "⚠️ Some packages failed, trying alternative installation..."

    # Install packages one by one
    pip install fastapi
    pip install uvicorn
    pip install python-multipart
    pip install python-jose
    pip install passlib
    pip install python-dotenv
    pip install sqlalchemy
    pip install bcrypt
    pip install twilio
fi

echo ""
echo "✅ Backend setup complete!"
echo "Starting server..."
echo ""

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000