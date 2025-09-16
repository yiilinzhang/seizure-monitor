# Sensor Monitoring App

A real-time sensor monitoring application built with React, TypeScript, and Vite. This app provides features for device connectivity, live monitoring, data history, emergency alerts, and customizable settings.

## Features

- **Device Connection**: Connect and manage sensor devices
- **Live Monitoring**: Real-time data visualization with charts
- **Historical Data**: View and analyze past sensor readings
- **Emergency Alerts**: Configure and manage emergency notifications
- **Settings**: Customize app preferences and configurations

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- For mobile testing: iOS/Android device or emulator

## Installation

1. Clone or download this repository:
```bash
git clone <repository-url>
cd "Sensor code Pixel"
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Web Development Server

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

Create an optimized production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Mobile Testing Options

### Option 1: Browser Mobile Emulation

1. Open the app in Chrome/Edge/Firefox
2. Press F12 to open Developer Tools
3. Click the device toggle button (usually looks like a phone/tablet icon)
4. Select a device preset (e.g., iPhone, Pixel, Galaxy)
5. The app will render in mobile view

### Option 2: Access from Mobile Device (Same Network)

1. Find your computer's IP address:
   - **Windows**: `ipconfig` (look for IPv4 Address)
   - **Mac/Linux**: `ifconfig` or `ip addr`

2. Start the dev server with host option:
```bash
npm run dev -- --host
```

3. On your mobile device, open browser and navigate to:
```
http://YOUR_COMPUTER_IP:5173
```

### Option 3: Mobile App Wrapper (Capacitor)

Transform this web app into a native mobile app:

1. Install Capacitor:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Sensor App" com.example.sensorapp
```

2. Add mobile platforms:
```bash
# For iOS
npx cap add ios
npm install @capacitor/ios

# For Android
npx cap add android
npm install @capacitor/android
```

3. Build and sync:
```bash
npm run build
npx cap sync
```

4. Open in native IDE:
```bash
# iOS (requires Xcode on Mac)
npx cap open ios

# Android (requires Android Studio)
npx cap open android
```

### Option 4: Progressive Web App (PWA)

Add PWA capabilities for installable mobile experience:

1. Install PWA plugin:
```bash
npm install vite-plugin-pwa -D
```

2. Update `vite.config.ts` to include PWA configuration
3. Build and deploy to HTTPS server
4. Users can install directly from browser

## Testing Mock Data

For development without real sensors, the app includes mock data functionality:

1. Mock sensor connections in `/connect` page
2. Simulated real-time data in `/live-monitor`
3. Sample historical data in `/history`
4. Test emergency alerts in `/emergency`

## Project Structure

```
Sensor code Pixel/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Application pages/routes
│   ├── App.tsx         # Main application component
│   └── index.tsx       # Application entry point
├── public/             # Static assets
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── vite.config.ts      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Customization

### Styling
- Tailwind CSS classes in components
- Global styles in `src/index.css`

### Routes
- Modify routes in `src/App.tsx`
- Add new pages in `src/pages/`

### Components
- Reusable components in `src/components/`
- Each component is self-contained with TypeScript props

## Troubleshooting

### Port Already in Use
If port 5173 is occupied, Vite will automatically use the next available port.

### Mobile Connection Issues
- Ensure devices are on the same network
- Check firewall settings
- Try using your computer's local IP instead of localhost

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

## Support

For issues or questions, please check the documentation or create an issue in the repository.