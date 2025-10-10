import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BluetoothIcon, InfoIcon } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
export const ConnectDevice: React.FC = () => {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate connection process
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      // Navigate to Live Monitor after connection
      setTimeout(() => {
        navigate('/live-monitor');
      }, 1000);
    }, 2000);
  };
  return <Layout title="Connect Sensor">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <BluetoothIcon size={20} className="text-brand-primary mr-2" />
                <h2 className="text-h2 font-semibold">MethoneSense-ESP32</h2>
              </div>
              <Chip variant={isConnected ? 'connected' : 'disconnected'} />
            </div>
            <div className="mb-4">
              <div className="text-bodySmall text-ink-60">Signal strength</div>
              <div className="text-body font-semibold">-67 dBm</div>
            </div>
            <Button onClick={handleConnect} disabled={isConnecting || isConnected} fullWidth>
              {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
            </Button>
          </Card>
        </div>
        <div className="mt-auto mb-8 text-center">
          <button onClick={() => setShowModal(true)} className="text-brand-primary text-bodySmall font-semibold">
            Trouble connecting?
          </button>
        </div>
      </div>
      {showModal && <div className="fixed inset-0 bg-ink-100/50 flex items-center justify-center p-margin z-50">
          <div className="bg-surface rounded-xl p-5 w-full max-w-md">
            <div className="flex items-start mb-4">
              <InfoIcon size={20} className="text-brand-primary mr-2 mt-0.5" />
              <div>
                <h3 className="text-h2 font-semibold mb-2">Connection Help</h3>
                <ol className="text-bodySmall space-y-2 list-decimal list-inside">
                  <li>Make sure your sensor is powered on</li>
                  <li>Ensure Bluetooth is enabled on your device</li>
                  <li>Keep the sensor within 10 meters of your phone</li>
                  <li>If still not connecting, try restarting the sensor</li>
                </ol>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setShowModal(false)} fullWidth>
              Close
            </Button>
          </div>
        </div>}
    </Layout>;
};