import React, { useState, useEffect } from 'react';
import { MoreVerticalIcon, ActivityIcon, ThermometerIcon, DropletIcon } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Chip } from '../components/Chip';
import { Card } from '../components/Card';
import { ChartContainer } from '../components/ChartContainer';
import { Slider } from '../components/Slider';
import { Toggle } from '../components/Toggle';
import { NumberField } from '../components/NumberField';
import { Button } from '../components/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface SensorData {
  id: string;
  timestamp: string;
  temperature?: number;
  humidity?: number;
  gas_resistance?: number;
  menthone_resistance?: number;
  heart_rate?: number;
  spo2?: number;
  emg_signal?: number;
}

export const LiveMonitor: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [smoothing, setSmoothing] = useState(0.5);
  const [showBaseline, setShowBaseline] = useState(true);
  const [threshold, setThreshold] = useState(15);
  const [duration, setDuration] = useState(5);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(10);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [baseline, setBaseline] = useState<number | null>(null);

  // Fetch sensor data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:8000/api/v1/sensor-data/history?hours=1&limit=60', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const readings = data.readings || [];
          setSensorData(readings);

          if (readings.length > 0) {
            setLatestData(readings[0]);

            // Set baseline if not set
            if (baseline === null && readings[0].gas_resistance) {
              setBaseline(readings[0].gas_resistance);
            }

            // Transform data for chart
            const transformed = readings.reverse().map((item: SensorData, index: number) => ({
              time: index,
              value: item.gas_resistance || item.menthone_resistance || 0
            }));
            setChartData(transformed);
          }
        }
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); // Fetch every 2 seconds

    return () => clearInterval(interval);
  }, [baseline]);

  const deltaPercent = latestData && baseline
    ? `${((latestData.gas_resistance! - baseline) / baseline * 100).toFixed(1)}%`
    : '0%';
  const isAlert = latestData && baseline
    ? Math.abs((latestData.gas_resistance! - baseline) / baseline * 100) > threshold
    : false;
  // Simulate alert
  const triggerAlert = () => {
    setShowAlert(true);
    let count = 10;
    const interval = setInterval(() => {
      count--;
      setAlertCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setShowAlert(false);
      }
    }, 1000);
  };
  return <Layout title="Live Monitor" rightElement={<div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-full hover:bg-gray-100">
            <MoreVerticalIcon size={20} className="text-ink-100" />
          </button>
          {showMenu && <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-ink-60/10 z-10">
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-bodySmall hover:bg-gray-50">
                  Re-baseline
                </button>
                <button className="w-full text-left px-4 py-2 text-bodySmall hover:bg-gray-50">
                  Set thresholds
                </button>
                <button className="w-full text-left px-4 py-2 text-bodySmall hover:bg-gray-50">
                  Device info
                </button>
              </div>
            </div>}
        </div>}>
      <div className="mt-4 flex items-center">
        <Chip variant="connected" />
      </div>
      <div className="mt-6 bg-surface rounded-xl p-4 shadow-sm">
        <div className={`text-title font-semibold ${isAlert ? 'text-semantic-alert' : 'text-semantic-ok'}`}>
          {deltaPercent}
        </div>
        <div className="flex justify-between mt-2">
          <div className="flex items-center">
            <ActivityIcon size={16} className="text-ink-60 mr-1" />
            <span className="text-mono text-ink-60">
              Baseline: {baseline ? `${baseline.toFixed(1)} kΩ` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center">
            <ThermometerIcon size={16} className="text-ink-60 mr-1" />
            <span className="text-mono text-ink-60">
              {latestData?.temperature ? `${latestData.temperature.toFixed(1)}°C` : 'N/A'}
            </span>
            <DropletIcon size={16} className="text-ink-60 ml-2 mr-1" />
            <span className="text-mono text-ink-60">
              {latestData?.humidity ? `${latestData.humidity.toFixed(0)}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
      <ChartContainer title="Menthone (relative)" className="mt-6">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{
          top: 5,
          right: 5,
          left: 0,
          bottom: 5
        }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={false} />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{
            fontSize: 12
          }} />
            <Line type="monotone" dataKey="value" stroke="#246BFD" strokeWidth={2} dot={false} />
            {showBaseline && <Line type="monotone" dataKey={() => 100} stroke="#64748B" strokeDasharray="5 5" strokeWidth={1} dot={false} />}
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-3">
          <Slider min={0} max={1} step={0.1} value={smoothing} onChange={setSmoothing} label="Smoothing" />
          <Toggle label="Show baseline" checked={showBaseline} onChange={setShowBaseline} />
        </div>
      </ChartContainer>
      <Card className="mt-6">
        <h2 className="text-h2 font-semibold mb-4">Controls</h2>
        <div className="space-y-4">
          <div>
            <div className="text-bodySmall text-ink-60 mb-1">Threshold</div>
            <Slider min={0} max={50} step={1} value={threshold} onChange={setThreshold} showValue={true} />
          </div>
          <div>
            <div className="text-bodySmall text-ink-60 mb-1">
              Duration (seconds)
            </div>
            <NumberField value={duration} onChange={setDuration} min={1} max={30} unit="s" />
          </div>
          <Button onClick={triggerAlert} fullWidth>
            Mark Event (manual)
          </Button>
        </div>
      </Card>
      {showAlert && <div className="fixed bottom-0 left-0 right-0 bg-semantic-alert p-4">
          <div className="text-white text-body font-semibold mb-2">
            Detection ongoing... calling in {alertCountdown}s
          </div>
          <Button variant="secondary" onClick={() => setShowAlert(false)} fullWidth>
            Cancel
          </Button>
        </div>}
    </Layout>;
};