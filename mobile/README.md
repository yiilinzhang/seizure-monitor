# Seizure Detector Mobile App

## 📱 Overview

React Native mobile application for real-time seizure detection using on-device machine learning. This app serves as the primary interface between ESP32 sensors and the emergency response system, featuring offline-first architecture with optional cloud synchronization.

## 🎯 Key Features

### Core Functionality
- **ESP32 Sensor Integration**: Bluetooth/WiFi connectivity for real-time data streaming
- **On-Device ML Inference**: PyTorch Mobile for immediate seizure detection
- **Offline-First Design**: Full functionality without internet connectivity
- **Emergency Alerts**: Automated SMS/call notifications to emergency contacts
- **Background Monitoring**: Continuous monitoring even when app is closed
- **Data Synchronization**: Automatic cloud sync when connection available

### User Features
- **Real-Time Monitoring**: Live sensor data visualization
- **Historical Analysis**: View past seizure events and patterns
- **Emergency Contacts**: Manage multiple emergency contacts
- **Custom Thresholds**: Personalize detection sensitivity
- **Privacy Controls**: Choose what data to share with cloud
- **Model Updates**: Receive improved ML models from cloud

## 🏗 Architecture

```
┌─────────────────────────────────────────┐
│          React Native App               │
├─────────────────────────────────────────┤
│  Presentation Layer                     │
│  ├── Screens (React Components)         │
│  ├── Navigation (React Navigation)      │
│  └── UI Components                      │
├─────────────────────────────────────────┤
│  State Management                       │
│  ├── Redux Toolkit (Global State)       │
│  ├── React Hooks (Local State)          │
│  └── AsyncStorage (Persistence)         │
├─────────────────────────────────────────┤
│  Business Logic                         │
│  ├── Seizure Detection Service          │
│  ├── Emergency Alert Service            │
│  ├── Sync Service                       │
│  └── Background Task Manager            │
├─────────────────────────────────────────┤
│  Data Layer                             │
│  ├── SQLite (Local Database)            │
│  ├── API Client (FastAPI Backend)       │
│  └── Cache Manager                      │
├─────────────────────────────────────────┤
│  Hardware Integration                   │
│  ├── Bluetooth Manager (ESP32)          │
│  ├── PyTorch Mobile (ML Inference)      │
│  └── Device Sensors (GPS, etc.)         │
└─────────────────────────────────────────┘
```

## 📁 Project Structure

```
mobile/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Buttons, inputs, cards
│   │   ├── charts/         # Data visualization
│   │   └── alerts/         # Alert components
│   │
│   ├── screens/            # App screens
│   │   ├── auth/          # Login, register, forgot password
│   │   ├── monitoring/    # Live monitoring, sensor status
│   │   ├── history/       # Historical data, analytics
│   │   ├── emergency/     # Emergency contacts, settings
│   │   └── settings/      # App preferences, profile
│   │
│   ├── navigation/         # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── types.ts
│   │
│   ├── services/           # Business logic
│   │   ├── bluetooth/     # ESP32 communication
│   │   ├── ml/            # PyTorch Mobile integration
│   │   ├── database/      # SQLite operations
│   │   ├── api/           # Backend communication
│   │   ├── emergency/     # Alert system
│   │   └── sync/          # Data synchronization
│   │
│   ├── store/             # Redux store
│   │   ├── slices/        # Feature slices
│   │   ├── middleware/    # Custom middleware
│   │   └── store.ts       # Store configuration
│   │
│   ├── models/            # TypeScript interfaces
│   │   ├── User.ts
│   │   ├── SensorData.ts
│   │   ├── SeizureEvent.ts
│   │   └── MLModel.ts
│   │
│   ├── hooks/             # Custom React hooks
│   │   ├── useBluetooth.ts
│   │   ├── useMLInference.ts
│   │   ├── useOfflineSync.ts
│   │   └── useEmergencyAlert.ts
│   │
│   ├── utils/             # Utility functions
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   └── formatters.ts
│   │
│   └── App.tsx            # App entry point
│
├── android/               # Android-specific code
│   ├── app/
│   ├── gradle/
│   └── settings.gradle
│
├── ios/                   # iOS-specific code
│   ├── SeizureDetector/
│   ├── Podfile
│   └── SeizureDetector.xcworkspace
│
├── assets/                # Images, fonts, etc.
│   ├── images/
│   ├── fonts/
│   └── models/           # TorchScript models
│
├── __tests__/            # Test files
│   ├── components/
│   ├── screens/
│   └── services/
│
└── configuration files   # Config files
    ├── .env.example
    ├── .eslintrc.js
    ├── .prettierrc.js
    ├── babel.config.js
    ├── metro.config.js
    ├── tsconfig.json
    └── jest.config.js
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **React Native CLI**: Latest version
- **Platform-specific requirements**:
  - **iOS**: macOS, Xcode 14+, CocoaPods
  - **Android**: Android Studio, JDK 11+

### Installation

1. **Install dependencies**
```bash
cd mobile
npm install
```

2. **iOS setup** (Mac only)
```bash
cd ios && pod install
cd ..
```

3. **Environment configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run the app**
```bash
# iOS
npm run ios

# Android
npm run android

# Start Metro bundler separately
npm start
```

## 🧪 Development

### Running Tests
```bash
# Unit tests
npm test

# Test coverage
npm run test:coverage

# E2E tests (Detox)
npm run e2e:ios
npm run e2e:android
```

### Debugging
```bash
# React Native Debugger
npm run debug

# Flipper
# Download from https://fbflipper.com/

# React DevTools
npm run devtools
```

### Code Quality
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

## 📦 Building for Production

### Android
```bash
# Generate release APK
cd android
./gradlew assembleRelease

# Generate release bundle (for Play Store)
./gradlew bundleRelease
```

### iOS
```bash
# Open in Xcode
cd ios && open SeizureDetector.xcworkspace

# Archive and upload to App Store Connect
# Product > Archive > Distribute App
```

## 🔧 Configuration

### Bluetooth Permissions

**Android** (android/app/src/main/AndroidManifest.xml):
```xml
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
```

**iOS** (ios/SeizureDetector/Info.plist):
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app needs Bluetooth to connect to seizure detection sensors</string>
```

### Background Tasks

**Android**: Configured in BackgroundTaskService.java

**iOS**: Background modes in Xcode:
- Background fetch
- Background processing
- Bluetooth-central

## 🔌 Key Integrations

### PyTorch Mobile
```typescript
import { PyTorchMobile } from 'react-native-pytorch-mobile';

const model = await PyTorchMobile.load('model.pt');
const prediction = await model.forward(sensorData);
```

### SQLite Storage
```typescript
import SQLite from 'react-native-sqlite-storage';

const db = await SQLite.openDatabase({
  name: 'seizure_detector.db',
  location: 'default',
});
```

### Bluetooth (ESP32)
```typescript
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();
await manager.startDeviceScan(null, null, (error, device) => {
  if (device?.name === 'ESP32-Seizure-Sensor') {
    // Connect and subscribe to characteristics
  }
});
```

## 📊 Performance Optimization

### Memory Management
- Lazy loading of screens
- Image optimization with react-native-fast-image
- Proper cleanup in useEffect hooks
- Bluetooth connection pooling

### Battery Optimization
- Adaptive sampling rates
- Batch processing for sync
- Efficient background tasks
- Smart wake locks

### Network Optimization
- Request queuing for offline mode
- Delta sync for data updates
- Compression for API calls
- CDN for model distribution

## 🔒 Security

### Data Protection
- Encrypted SQLite database
- Keychain/Keystore for sensitive data
- Certificate pinning for API calls
- Biometric authentication support

### Privacy
- On-device processing by default
- User consent for cloud sync
- Data anonymization options
- GDPR/HIPAA compliance

## 📱 Platform-Specific Features

### iOS
- HealthKit integration
- Core ML as fallback
- Haptic feedback
- 3D Touch shortcuts

### Android
- Google Fit integration
- TensorFlow Lite as fallback
- Material Design
- App shortcuts

## 🐛 Troubleshooting

### Common Issues

1. **Build fails on iOS**
```bash
cd ios && pod deintegrate && pod install
```

2. **Metro bundler issues**
```bash
npx react-native start --reset-cache
```

3. **Android Gradle issues**
```bash
cd android && ./gradlew clean
```

4. **Bluetooth not working**
- Check permissions in settings
- Ensure ESP32 is powered on
- Reset Bluetooth on device

## 📚 Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [PyTorch Mobile Guide](https://pytorch.org/mobile/)
- [BLE Communication](https://github.com/dotintent/react-native-ble-plx)
- [SQLite Storage](https://github.com/andpor/react-native-sqlite-storage)

## 🤝 Contributing

See main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](../LICENSE) file.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/seizure-detection/issues)
- **Documentation**: [Main Docs](../docs/)
- **Community**: [Discord Server](https://discord.gg/seizuredetection)