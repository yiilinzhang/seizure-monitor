# Quick Start Guide

## 🚀 Fastest Setup

### 1. Backend Setup (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install minimal requirements (without ML packages)
pip install -r requirements-minimal.txt

# Run the server
uvicorn app.main:app --reload
```

The API will be running at:
- http://localhost:8000
- API docs: http://localhost:8000/docs

### 2. Mobile App Setup

The mobile app needs to be properly initialized with React Native CLI:

```bash
cd mobile

# Initialize React Native project (one-time setup)
npx @react-native-community/cli@latest init SeizureDetector \
  --template react-native-template-typescript \
  --skip-install

# Copy our source files to the new project
cp -r src SeizureDetector/
cp App.tsx SeizureDetector/

# Go to the project and install dependencies
cd SeizureDetector
npm install

# For iOS (Mac only)
cd ios && pod install && cd ..
npx react-native run-ios

# For Android
npx react-native run-android
```

## 🔧 Troubleshooting

### Backend Issues

If you get package errors, use the minimal requirements:
```bash
pip install -r requirements-minimal.txt
```

### Mobile Issues

If React Native commands don't work:
1. Make sure you have React Native CLI installed globally:
   ```bash
   npm install -g @react-native-community/cli
   ```

2. Follow the React Native environment setup:
   https://reactnative.dev/docs/environment-setup

### Common Errors

**"uvicorn: command not found"**
```bash
# Make sure you activated the virtual environment
source backend/venv/bin/activate
# Then install uvicorn
pip install uvicorn
```

**"torch version not found"**
```bash
# Use requirements-minimal.txt instead
pip install -r requirements-minimal.txt
```

**Mobile app won't build**
```bash
# You need to properly initialize the React Native project first
cd mobile
npx @react-native-community/cli init SeizureDetector
```

## 📱 Testing the System

1. **Test Backend API**:
   ```bash
   curl http://localhost:8000/health/status
   ```

2. **View API Documentation**:
   Open http://localhost:8000/docs in your browser

3. **Test Registration**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
   ```

## 🎯 Next Steps

1. Set up Twilio credentials for emergency alerts
2. Configure PostgreSQL database (currently using SQLite)
3. Deploy backend to cloud (Heroku, Railway, or AWS)
4. Build mobile apps for distribution