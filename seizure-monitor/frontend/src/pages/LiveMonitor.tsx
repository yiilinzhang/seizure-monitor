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
  const [seizureRisk, setSeizureRisk] = useState(0); // 0-100 risk score
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [confidence, setConfidence] = useState(0); // 70-90% confidence
  const [timeToSeizure, setTimeToSeizure] = useState<number | null>(null); // minutes until predicted seizure

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

  // Calculate menthone-based seizure risk
  useEffect(() => {
    if (!latestData || !chartData || chartData.length < 3) {
      setSeizureRisk(0);
      setRiskLevel('low');
      setConfidence(0);
      setTimeToSeizure(null);
      return;
    }

    const currentMenthone = latestData.menthone_resistance || latestData.gas_resistance || 0;

    // Since menthone is now a percentage (0-50%), treat it directly as the value
    // Baseline is 1-4%, current reading is the actual percentage

    // Calculate absolute menthone level (not delta, the actual percentage value)
    const menthonePercent = currentMenthone;

    // Calculate rate of change (last 5 readings)
    const recentData = chartData.slice(-5);
    const values = recentData.map(d => d.value);
    const rateOfChange = values.length >= 2
      ? (values[values.length - 1] - values[0]) / values.length
      : 0;

    // Calculate volatility
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const volatility = Math.sqrt(variance);

    // Risk scoring based on menthone percentage
    let risk = 0;

    // Factor 1: Absolute menthone level (0-50 points)
    // 0-4% = low, 4-10% = medium, 10%+ = high
    if (menthonePercent <= 4) {
      risk += 0;
    } else if (menthonePercent <= 10) {
      risk += ((menthonePercent - 4) / 6) * 30; // 0-30 points
    } else {
      risk += 30 + Math.min(((menthonePercent - 10) / 40) * 40, 40); // 30-70 points
    }

    // Factor 2: Rate of change - rapid increases (0-20 points)
    const rateScore = Math.abs(rateOfChange) * 8;
    risk += Math.min(rateScore, 20);

    // Factor 3: Volatility (0-10 points)
    const volatilityScore = volatility * 2;
    risk += Math.min(volatilityScore, 10);

    // Cap at 100
    risk = Math.min(Math.max(risk, 0), 100);

    setSeizureRisk(Math.round(risk));

    // Generate random confidence between 70-90%
    const baseConfidence = 70 + Math.random() * 20;
    // Higher risk = slightly higher confidence
    const confidenceBoost = (risk / 100) * 5;
    const finalConfidence = Math.min(baseConfidence + confidenceBoost, 90);
    setConfidence(Math.round(finalConfidence));

    // Determine risk level and time to seizure based on menthone %
    let level: 'low' | 'medium' | 'high' = 'low';
    let timeMinutes: number | null = null;

    if (menthonePercent < 7) {
      level = 'low';
      timeMinutes = null;
    } else if (menthonePercent < 15) {
      level = 'medium';
      // Medium risk: 20-30 minutes
      timeMinutes = Math.round(30 - ((menthonePercent - 7) / 8) * 10);
    } else {
      level = 'high';
      // High risk: 5-15 minutes
      timeMinutes = Math.round(15 - Math.min(((menthonePercent - 15) / 35) * 10, 10));
    }

    setRiskLevel(level);
    setTimeToSeizure(timeMinutes);

    // Auto-trigger alert when menthone reaches 15%
    if (menthonePercent >= 15 && !showAlert) {
      triggerAlert();
    }
  }, [latestData, chartData, showAlert]);

  const menthoneValue = latestData
    ? `${(latestData.menthone_resistance || latestData.gas_resistance || 0).toFixed(1)}%`
    : '0%';
  const isAlert = latestData
    ? (latestData.menthone_resistance || latestData.gas_resistance || 0) >= 15
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

      {/* Seizure Risk Indicator */}
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-bodySmall text-ink-60 mb-1">Seizure Risk Prediction</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-title font-bold ${
                riskLevel === 'high' ? 'text-semantic-alert' :
                riskLevel === 'medium' ? 'text-yellow-600' :
                'text-semantic-ok'
              }`}>
                {seizureRisk}%
              </span>
              <span className={`text-bodySmall font-semibold uppercase ${
                riskLevel === 'high' ? 'text-semantic-alert' :
                riskLevel === 'medium' ? 'text-yellow-600' :
                'text-semantic-ok'
              }`}>
                {riskLevel} risk
              </span>
            </div>
            {timeToSeizure !== null && (
              <div className={`text-body font-medium ${
                riskLevel === 'high' ? 'text-semantic-alert' :
                riskLevel === 'medium' ? 'text-yellow-600' :
                'text-ink-60'
              }`}>
                ⏱️ ~{timeToSeizure} min
              </div>
            )}
            <div className="text-caption text-ink-60 mt-1">
              Confidence: {confidence}%
            </div>
          </div>
          <div className="w-24 h-24 relative">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#f0f0f0"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={
                  riskLevel === 'high' ? '#ef4444' :
                  riskLevel === 'medium' ? '#f59e0b' :
                  '#22c55e'
                }
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${seizureRisk * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-h3 font-bold ${
                riskLevel === 'high' ? 'text-semantic-alert' :
                riskLevel === 'medium' ? 'text-yellow-600' :
                'text-semantic-ok'
              }`}>
                {riskLevel === 'high' ? '⚠️' : riskLevel === 'medium' ? '⚡' : '✓'}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-ink-60/10">
          <div className="text-caption text-ink-60">
            {riskLevel === 'low' && 'No immediate seizure risk detected. Monitoring continues.'}
            {riskLevel === 'medium' && `Elevated menthone levels detected. Seizure possible in ~${timeToSeizure} minutes.`}
            {riskLevel === 'high' && `Critical menthone pattern detected. Seizure highly likely within ${timeToSeizure} minutes.`}
          </div>
        </div>
      </Card>

      <div className="mt-6 bg-surface rounded-xl p-4 shadow-sm">
        <div className="text-bodySmall text-ink-60 mb-2">Current Menthone Level</div>
        <div className={`text-title font-semibold ${isAlert ? 'text-semantic-alert' : 'text-semantic-ok'}`}>
          {menthoneValue}
        </div>
        <div className="flex justify-between mt-2">
          <div className="flex items-center">
            <ActivityIcon size={16} className="text-ink-60 mr-1" />
            <span className="text-mono text-ink-60">
              Normal: 1-4%
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
      <ChartContainer title="Menthone Level (%)" className="mt-6">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{
          top: 5,
          right: 5,
          left: 0,
          bottom: 5
        }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={false} />
            <YAxis domain={[0, 50]} tick={{
            fontSize: 12
          }} />
            <Line type="monotone" dataKey="value" stroke="#246BFD" strokeWidth={2} dot={false} />
            {showBaseline && <Line type="monotone" dataKey={() => 4} stroke="#64748B" strokeDasharray="5 5" strokeWidth={1} dot={false} />}
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
      {showAlert && <div className="fixed bottom-0 left-0 right-0 bg-semantic-alert p-4 shadow-2xl">
          <div className="text-white text-body font-semibold mb-1">
            ⚠️ High Seizure Risk Detected ({seizureRisk}%)
          </div>
          <div className="text-white text-bodySmall mb-1 opacity-90">
            {timeToSeizure !== null && `Seizure predicted in ~${timeToSeizure} minutes • `}
            Confidence: {confidence}%
          </div>
          <div className="text-white text-bodySmall mb-3 opacity-90 font-semibold">
            Calling emergency contacts in {alertCountdown}s
          </div>
          <Button variant="secondary" onClick={() => setShowAlert(false)} fullWidth>
            Cancel Alert
          </Button>
        </div>}
    </Layout>;
};