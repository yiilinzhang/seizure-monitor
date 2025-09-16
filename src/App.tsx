import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConnectDevice } from './pages/ConnectDevice';
import { LiveMonitor } from './pages/LiveMonitor';
import { History } from './pages/History';
import { Emergency } from './pages/Emergency';
import { Settings } from './pages/Settings';
import { Navigation } from './components/Navigation';
export function App() {
  return <BrowserRouter>
      <div className="bg-bg min-h-screen pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/connect" replace />} />
          <Route path="/connect" element={<ConnectDevice />} />
          <Route path="/live-monitor" element={<LiveMonitor />} />
          <Route path="/history" element={<History />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>;
}