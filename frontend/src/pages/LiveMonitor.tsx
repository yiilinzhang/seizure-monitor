import React, { useState } from 'react';
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
// Mock data for the chart
const generateMockData = () => {
  const data = [];
  for (let i = 0; i < 60; i++) {
    const baseValue = 100 + Math.sin(i / 10) * 15;
    const noise = Math.random() * 5;
    data.push({
      time: i,
      value: baseValue + noise
    });
  }
  return data;
};
export const LiveMonitor: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [smoothing, setSmoothing] = useState(0.5);
  const [showBaseline, setShowBaseline] = useState(true);
  const [threshold, setThreshold] = useState(15);
  const [duration, setDuration] = useState(5);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(10);
  const chartData = generateMockData();
  const deltaPercent = '+18%';
  const isAlert = true;
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
            <span className="text-mono text-ink-60">Baseline: 120 kΩ</span>
          </div>
          <div className="flex items-center">
            <ThermometerIcon size={16} className="text-ink-60 mr-1" />
            <span className="text-mono text-ink-60">24°C</span>
            <DropletIcon size={16} className="text-ink-60 ml-2 mr-1" />
            <span className="text-mono text-ink-60">45%</span>
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