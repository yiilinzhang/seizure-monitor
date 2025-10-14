import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConnectDevice } from './pages/ConnectDevice';
import { LiveMonitor } from './pages/LiveMonitor';
import { SensorControl } from './pages/SensorControl';
import { History } from './pages/History';
import { Emergency } from './pages/Emergency';
import { Settings } from './pages/Settings';
import { Navigation } from './components/Navigation';
import { Login } from './components/Login';
import { apiService } from './services/api';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      const authenticated = apiService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-ink-100">Loading...</div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Login onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="bg-bg min-h-screen pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/sensor-control" replace />} />
          <Route path="/connect" element={<ConnectDevice />} />
          <Route path="/live-monitor" element={<LiveMonitor />} />
          <Route path="/sensor-control" element={<SensorControl />} />
          <Route path="/history" element={<History />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>
  );
}

export default App;
