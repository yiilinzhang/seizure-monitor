# Seizure Detection System

An AI-powered emergency response system for real-time seizure detection using ESP32 sensors, React Native mobile app, and FastAPI backend.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+ (or use SQLite for development)
- React Native development environment ([Setup Guide](https://reactnative.dev/docs/environment-setup))

### Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload

# API will be available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### Mobile App Setup (React Native)

```bash
cd mobile
npm install

# iOS (Mac only)
cd ios && pod install && cd ..
npm run ios

# Android
npm run android

# Start Metro bundler (if not auto-started)
npx react-native start
```

## 📁 Project Structure

```
seizure-detection-system/
├── mobile/              # React Native mobile app
├── backend/             # FastAPI backend server
├── ml/                  # Machine learning models
├── hardware/            # ESP32 firmware
└── docs/                # Documentation
```

## 🏗 Architecture

### System Components

1. **ESP32 Sensor Module** - Collects accelerometer, gyroscope, and biometric data
2. **React Native App** - Offline-first mobile app with local ML inference
3. **FastAPI Backend** - REST API with WebSocket support for real-time updates
4. **PostgreSQL Database** - Stores user data and sensor readings
5. **PyTorch Models** - Seizure detection ML models

### Data Flow

```
ESP32 → Bluetooth → Mobile App → Local SQLite
                         ↓
                   PyTorch Mobile (Inference)
                         ↓
                   Emergency Alert (if detected)
                         ↓
                   Sync to Cloud (when online)
```

## 💻 Development

### Backend Development

```bash
cd backend

# Create .env file
cat > .env << EOL
DATABASE_URL=postgresql://user:pass@localhost/seizure_db
SECRET_KEY=your-secret-key-here
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
EOL

# Run with auto-reload
uvicorn app.main:app --reload --port 8000
```

### Mobile Development

```bash
cd mobile

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Build for production
# iOS
cd ios && xcodebuild -workspace SeizureDetector.xcworkspace -scheme SeizureDetector -configuration Release

# Android
cd android && ./gradlew assembleRelease
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/contacts` - Get emergency contacts
- `POST /api/v1/contacts` - Add emergency contact
- `POST /api/v1/trigger` - Trigger emergency alert
- `WS /ws` - WebSocket for real-time updates

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Mobile tests
cd mobile
npm test

# End-to-end tests
npm run test:e2e
```

## 🔧 Configuration

### Environment Variables

Backend (`backend/.env`):
```env
DATABASE_URL=postgresql://user:pass@localhost/db
SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

Mobile (`mobile/.env`):
```env
API_URL=http://localhost:8000
ENABLE_MOCK_DATA=false
```

## 📱 Features

### Mobile App
- ✅ Bluetooth connection to ESP32
- ✅ Real-time sensor monitoring
- ✅ Offline seizure detection
- ✅ Emergency contact management
- ✅ Automatic SMS/call alerts
- ✅ Historical data analysis
- ✅ Background monitoring

### Backend
- ✅ JWT authentication
- ✅ RESTful API
- ✅ WebSocket support
- ✅ Twilio integration
- ✅ Async database operations
- ✅ Auto-generated documentation

## 🚢 Deployment

### Backend Deployment

```bash
# Using Docker
docker build -t seizure-backend .
docker run -p 8000:8000 --env-file .env seizure-backend

# Using Docker Compose
docker-compose up -d
```

### Mobile Deployment

```bash
# iOS - App Store
cd ios
fastlane release

# Android - Play Store
cd android
fastlane release
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/seizure-detection/issues)
- **Email**: support@seizuredetection.com
- **Documentation**: [docs/](docs/)

## ⚠️ Disclaimer

This system is intended to supplement, not replace, professional medical care. Always consult with healthcare providers for medical advice.