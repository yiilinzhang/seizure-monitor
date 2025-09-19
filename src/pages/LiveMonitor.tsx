import React, { useState, useEffect } from 'react';
import { MoreVerticalIcon, ActivityIcon, ThermometerIcon, DropletIcon, HeartIcon, BrainIcon, WindIcon, AlertCircleIcon } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Chip } from '../components/Chip';
import { ChartContainer } from '../components/ChartContainer';
import { Toggle } from '../components/Toggle';
import { Button } from '../components/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { seizurePredictor } from '../services/seizure-predictor';
import type { SensorData, PredictionOutput, DetectionOutput } from '../services/seizure-predictor';

type TabType = 'menthone' | 'heartRate' | 'muscleSignal' | 'bloodOxygen';

// Use stable seed for consistent data generation
const generateDataWithSeed = (baseValue: number, amplitude: number, frequency: number, noise: number, seed: number) => {
  const data = [];
  const random = (x: number) => {
    const sin = Math.sin(x * 12.9898 + seed * 78.233);
    return (sin * 43758.5453) % 1;
  };

  for (let i = 0; i < 60; i++) {
    const value = baseValue + Math.sin(i / frequency) * amplitude + random(i) * noise;
    data.push({
      time: i,
      value: Math.round(value)
    });
  }
  return data;
};
export const LiveMonitor: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(10);
  const [activeTab, setActiveTab] = useState<TabType>('menthone');
  const [predictionResult, setPredictionResult] = useState<PredictionOutput | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionOutput | null>(null);
  const [sensorHistory, setSensorHistory] = useState<SensorData[]>([]);
  const [hrBaseline] = useState(75);
  const [menthoneValue, setMenthoneValue] = useState(100);
  const [simulationScenario, setSimulationScenario] = useState(0);
  const [showSeizurePopup, setShowSeizurePopup] = useState(false);
  const [seizureEventData, setSeizureEventData] = useState<any>(null);
  const [chartDataCache, setChartDataCache] = useState<Record<TabType, any[]>>({
    heartRate: [],
    muscleSignal: [],
    menthone: [],
    bloodOxygen: []
  });

  // Cycle through different risk scenarios for demonstration
  useEffect(() => {
    const scenarioInterval = setInterval(() => {
      setSimulationScenario(prev => (prev + 1) % 4);
    }, 30000); // Change scenario every 30 seconds

    return () => clearInterval(scenarioInterval);
  }, []);

  // Initialize chart data once
  useEffect(() => {
    setChartDataCache({
      heartRate: generateDataWithSeed(75, 10, 8, 3, 1),
      muscleSignal: generateDataWithSeed(50, 20, 5, 10, 2),
      menthone: generateDataWithSeed(100 + (simulationScenario * 10), 15, 10, 5, 3),
      bloodOxygen: generateDataWithSeed(97, 2, 15, 1, 4)
    });
  }, [simulationScenario]);

  // Get data based on active tab
  const getChartData = () => {
    return chartDataCache[activeTab] || [];
  };

  const getMetricInfo = () => {
    switch (activeTab) {
      case 'heartRate':
        return {
          title: 'Heart Rate',
          unit: 'bpm',
          baseline: '75 bpm',
          deltaPercent: '+12%',
          color: '#ef4444',
          icon: HeartIcon,
          currentValue: '84'
        };
      case 'muscleSignal':
        return {
          title: 'Muscle Signal',
          unit: 'μV',
          baseline: '50 μV',
          deltaPercent: '+25%',
          color: '#8b5cf6',
          icon: BrainIcon,
          currentValue: '62.5'
        };
      case 'menthone':
        return {
          title: 'Menthone',
          unit: 'kΩ',
          baseline: '120 kΩ',
          deltaPercent: '+18%',
          color: '#246BFD',
          icon: ActivityIcon,
          currentValue: '141.6'
        };
      case 'bloodOxygen':
        return {
          title: 'Blood Oxygen',
          unit: '%',
          baseline: '98%',
          deltaPercent: '-1%',
          color: '#10b981',
          icon: WindIcon,
          currentValue: '97'
        };
      default:
        return {
          title: 'Heart Rate',
          unit: 'bpm',
          baseline: '75 bpm',
          deltaPercent: '+12%',
          color: '#ef4444',
          icon: HeartIcon,
          currentValue: '84'
        };
    }
  };

  const chartData = getChartData();
  const metricInfo = getMetricInfo();
  const isAlert = activeTab === 'menthone' && parseFloat(metricInfo.deltaPercent) > 15;
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
  // Simulate sensor data at 2Hz with varying scenarios
  useEffect(() => {
    const interval = setInterval(() => {
      let menthdelta = 0;
      let emgValue = 0.3;
      let hrMultiplier = 1.0;
      let spo2Value = 97;

      // Different scenarios for demonstration
      switch (simulationScenario) {
        case 0: // Low risk - normal values
          menthdelta = (Math.random() - 0.5) * 5;
          emgValue = 0.2 + Math.random() * 0.2;
          hrMultiplier = 1.0;
          spo2Value = 97 + Math.random() * 2;
          break;
        case 1: // Medium risk - elevated menthone
          menthdelta = 10 + Math.random() * 8;
          emgValue = 0.4 + Math.random() * 0.2;
          hrMultiplier = 1.1;
          spo2Value = 96 + Math.random() * 2;
          break;
        case 2: // High risk - significant spike
          menthdelta = 25 + Math.random() * 10;
          emgValue = 0.6 + Math.random() * 0.2;
          hrMultiplier = 1.25;
          spo2Value = 94 + Math.random() * 2;
          break;
        case 3: // Very high risk - imminent seizure
          menthdelta = 35 + Math.random() * 15;
          emgValue = 0.75 + Math.random() * 0.2;
          hrMultiplier = 1.35;
          spo2Value = 92 + Math.random() * 2;
          break;
      }

      const currentMenthone = 100 + menthdelta;
      setMenthoneValue(currentMenthone);

      const sensorData: SensorData = {
        menthone: {
          delta_pct: menthdelta,
          value: currentMenthone,
          timestamp: Date.now()
        },
        emg: {
          envelope: Math.min(1, emgValue),
          timestamp: Date.now()
        },
        hr: {
          bpm: hrBaseline * hrMultiplier + Math.random() * 5,
          baseline_bpm: hrBaseline,
          timestamp: Date.now()
        },
        spo2: {
          pct: spo2Value,
          timestamp: Date.now()
        },
        quality: {
          menthone: true,
          emg: true,
          hr: true,
          spo2: true
        }
      };

      // Process through seizure predictor
      const { prediction, detection } = seizurePredictor.processTick(sensorData);
      setPredictionResult(prediction);
      setDetectionResult(detection);

      // Update sensor history
      setSensorHistory(prev => [...prev.slice(-599), sensorData]); // Keep last 5 minutes

      // Trigger seizure popup if detection is active
      if (detection.active && !showSeizurePopup) {
        setShowSeizurePopup(true);
        setSeizureEventData({
          sensorData,
          detection,
          prediction,
          timestamp: Date.now()
        });
        // Play alert sound
        playAlertSound();
      }
    }, 500); // 2Hz = 500ms interval

    return () => clearInterval(interval);
  }, [simulationScenario, hrBaseline, showAlert]);

  // Get prediction display based on actual results
  const getPredictionDisplay = () => {
    if (!predictionResult) {
      return {
        level: 'Loading',
        color: '#64748B',
        message: 'Initializing sensors...',
        confidence: '0%'
      };
    }

    let level = 'Low';
    let color = '#10b981';
    let message = 'No immediate risk detected';

    if (predictionResult.predicted) {
      if (predictionResult.horizon_s <= 300) {
        level = 'High';
        color = '#ef4444';
        message = `Seizure likely in ${Math.round(predictionResult.horizon_s / 60)} minutes`;
      } else if (predictionResult.horizon_s <= 1800) {
        level = 'Medium';
        color = '#f59e0b';
        message = `Elevated risk - possible in ${Math.round(predictionResult.horizon_s / 60)} minutes`;
      } else {
        level = 'Low';
        color = '#3b82f6';
        message = `Slight elevation detected - monitoring`;
      }
    }

    return {
      level,
      color,
      message,
      confidence: `${Math.round(predictionResult.confidence * 100)}%`,
      horizon: predictionResult.horizon_s
    };
  };

  const prediction = getPredictionDisplay();

  // Play alert sound for seizure detection
  const playAlertSound = () => {
    // Create an audio context and play a beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Play three beeps
    oscillator.frequency.value = 880; // A5 note
    gainNode.gain.value = 0.3;

    oscillator.start();

    // Create pulsing beeps
    setTimeout(() => {
      gainNode.gain.value = 0;
      setTimeout(() => {
        gainNode.gain.value = 0.3;
        setTimeout(() => {
          gainNode.gain.value = 0;
          setTimeout(() => {
            gainNode.gain.value = 0.3;
            setTimeout(() => {
              oscillator.stop();
            }, 200);
          }, 100);
        }, 200);
      }, 100);
    }, 200);
  };

  // Handle user feedback on seizure detection
  const handleSeizureFeedback = async (wasCorrect: boolean) => {
    console.log(`User feedback: Detection was ${wasCorrect ? 'correct' : 'false positive'}`);

    // If confirmed as correct seizure, log to calendar
    if (wasCorrect && seizureEventData) {
      // Get existing seizure logs from localStorage
      const existingLogs = localStorage.getItem('seizureLogs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      // Create new seizure event
      const newEvent = {
        id: Date.now(),
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString(),
        confidence: seizureEventData.detection?.confidence || 0,
        duration: 'Unknown', // Could be tracked with start/end times
        severity: seizureEventData.sensorData?.menthone?.delta_pct > 40 ? 'High' : 'Moderate',
        notes: seizureEventData.isTest ? 'Test event' : 'Detected and confirmed by user',
        sensorData: {
          menthone: seizureEventData.sensorData?.menthone?.delta_pct || 0,
          heartRate: seizureEventData.sensorData?.hr?.bpm || 0,
          spo2: seizureEventData.sensorData?.spo2?.pct || 0,
          emg: seizureEventData.sensorData?.emg?.envelope || 0
        }
      };

      // Add to logs and save
      logs.push(newEvent);
      localStorage.setItem('seizureLogs', JSON.stringify(logs));

      console.log('Seizure event logged to calendar:', newEvent);
    }

    // Prepare data for OpenAI recalibration
    const feedbackData = {
      ...seizureEventData,
      userFeedback: wasCorrect,
      feedbackTime: Date.now()
    };

    // Trigger recalibration with OpenAI
    await seizurePredictor.recalibrateWithOpenAI(feedbackData);

    // Close popup and reset
    setShowSeizurePopup(false);
    setSeizureEventData(null);

    // Show confirmation
    alert(`Thank you for your feedback. ${wasCorrect ? 'Seizure has been logged to your calendar.' : ''} The system will ${wasCorrect ? 'maintain' : 'adjust'} its detection thresholds.`);
  };

  // Test seizure detection
  const handleTestSeizure = () => {
    // Create test data that simulates a seizure event
    const testSensorData: SensorData = {
      menthone: {
        delta_pct: 45, // High spike
        value: 145,
        timestamp: Date.now()
      },
      emg: {
        envelope: 0.85, // High muscle activity
        timestamp: Date.now()
      },
      hr: {
        bpm: 110, // Elevated heart rate
        baseline_bpm: 75,
        timestamp: Date.now()
      },
      spo2: {
        pct: 91, // Low oxygen
        timestamp: Date.now()
      },
      quality: {
        menthone: true,
        emg: true,
        hr: true,
        spo2: true
      }
    };

    // Process through predictor to get detection result
    const { prediction, detection } = seizurePredictor.processTick(testSensorData);

    // Show the seizure popup and play sound
    setShowSeizurePopup(true);
    setSeizureEventData({
      sensorData: testSensorData,
      detection,
      prediction,
      timestamp: Date.now(),
      isTest: true
    });

    // Play alert sound
    playAlertSound();

    console.log('Test seizure triggered:', { detection, prediction });
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
      {/* Prediction Section */}
      <div className="mt-4 bg-surface rounded-xl p-4 shadow-sm border border-ink-60/10">
        <h2 className="text-h2 font-semibold mb-3">Prediction</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: prediction.color }}
            />
            <span
              className="text-h3 font-semibold"
              style={{ color: prediction.color }}
            >
              {prediction.level}
            </span>
          </div>
          <p className="text-body text-ink-100">{prediction.message}</p>
          <div className="mt-3 pt-3 border-t border-ink-60/10">
            <p className="text-bodySmall text-ink-60">
              Key data at {new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: false
              }).toLowerCase().replace(/\s/g, '')}
            </p>
            <p className="text-mono text-ink-60 mt-1">Confidence: {prediction.confidence}</p>
            {detectionResult && detectionResult.active && (
              <p className="text-bodySmall text-red-600 font-semibold mt-2">
                DETECTION: Active seizure detected
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center">
        <Chip variant="connected" />
      </div>

      {/* Tab buttons */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('menthone')}
          className={`px-4 py-2 rounded-lg font-medium text-bodySmall whitespace-nowrap transition-all ${
            activeTab === 'menthone'
              ? 'bg-brand-primary text-white'
              : 'bg-surface text-ink-60 hover:bg-ink-60/10'
          }`}
        >
          <ActivityIcon size={16} className="inline mr-1" />
          Menthone
        </button>
        <button
          onClick={() => setActiveTab('heartRate')}
          className={`px-4 py-2 rounded-lg font-medium text-bodySmall whitespace-nowrap transition-all ${
            activeTab === 'heartRate'
              ? 'bg-brand-primary text-white'
              : 'bg-surface text-ink-60 hover:bg-ink-60/10'
          }`}
        >
          <HeartIcon size={16} className="inline mr-1" />
          Heart Rate
        </button>
        <button
          onClick={() => setActiveTab('muscleSignal')}
          className={`px-4 py-2 rounded-lg font-medium text-bodySmall whitespace-nowrap transition-all ${
            activeTab === 'muscleSignal'
              ? 'bg-brand-primary text-white'
              : 'bg-surface text-ink-60 hover:bg-ink-60/10'
          }`}
        >
          <BrainIcon size={16} className="inline mr-1" />
          Muscle
        </button>
        <button
          onClick={() => setActiveTab('bloodOxygen')}
          className={`px-4 py-2 rounded-lg font-medium text-bodySmall whitespace-nowrap transition-all ${
            activeTab === 'bloodOxygen'
              ? 'bg-brand-primary text-white'
              : 'bg-surface text-ink-60 hover:bg-ink-60/10'
          }`}
        >
          <WindIcon size={16} className="inline mr-1" />
          Blood O₂
        </button>
      </div>

      <div className="mt-4 bg-surface rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {React.createElement(metricInfo.icon, { size: 20, className: 'mr-2', style: { color: metricInfo.color } })}
            <span className="text-h2 font-semibold">{metricInfo.currentValue}</span>
            <span className="text-bodySmall text-ink-60 ml-2">{metricInfo.unit}</span>
          </div>
          <div className={`text-title font-semibold ${isAlert ? 'text-semantic-alert' : 'text-semantic-ok'}`}>
            {metricInfo.deltaPercent}
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="flex items-center">
            <ActivityIcon size={16} className="text-ink-60 mr-1" />
            <span className="text-mono text-ink-60">Baseline: {metricInfo.baseline}</span>
          </div>
          <div className="flex items-center">
            <ThermometerIcon size={16} className="text-ink-60 mr-1" />
            <span className="text-mono text-ink-60">24°C</span>
            <DropletIcon size={16} className="text-ink-60 ml-2 mr-1" />
            <span className="text-mono text-ink-60">45%</span>
          </div>
        </div>
      </div>
      <ChartContainer title={`${metricInfo.title} (${metricInfo.unit})`} className="mt-6">
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
            <Line type="monotone" dataKey="value" stroke={metricInfo.color} strokeWidth={2} dot={false} />
            {showBaseline && <Line type="monotone" dataKey={() => {
              switch (activeTab) {
                case 'heartRate': return 75;
                case 'muscleSignal': return 50;
                case 'menthone': return 100;
                case 'bloodOxygen': return 97;
                default: return 100;
              }
            }} stroke="#64748B" strokeDasharray="5 5" strokeWidth={1} dot={false} />}
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4">
          <Toggle label="Show baseline" checked={showBaseline} onChange={setShowBaseline} />
        </div>
      </ChartContainer>
      {showAlert && <div className="fixed bottom-0 left-0 right-0 bg-semantic-alert p-4">
          <div className="text-white text-body font-semibold mb-2">
            Detection ongoing... calling in {alertCountdown}s
          </div>
          <Button variant="secondary" onClick={() => setShowAlert(false)} fullWidth>
            Cancel
          </Button>
        </div>}

      {/* Seizure Detection Popup */}
      {showSeizurePopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-red-600 p-8 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="text-center">
              <div className="text-6xl font-bold text-white mb-4">
                ⚠️
              </div>
              <h1 className="text-4xl font-bold text-white mb-6">
                SEIZURE DETECTED
              </h1>
              <div className="bg-white/20 rounded-lg p-4 mb-6">
                <p className="text-white text-lg mb-2">
                  {seizureEventData?.isTest ? 'TEST: ' : ''}The system has detected a potential seizure event.
                </p>
                <p className="text-white/90 text-sm">
                  Confidence: {detectionResult ? `${Math.round(detectionResult.confidence * 100)}%` : 'N/A'}
                </p>
              </div>
              <p className="text-white text-xl font-semibold mb-6">
                Is this detection correct?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleSeizureFeedback(true)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors"
                >
                  YES - Correct
                </button>
                <button
                  onClick={() => handleSeizureFeedback(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors"
                >
                  NO - False Alarm
                </button>
              </div>
              <p className="text-white/70 text-xs mt-4">
                Your feedback helps improve detection accuracy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Test Seizure Button */}
      <button
        onClick={handleTestSeizure}
        className="fixed bottom-24 right-4 w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-colors"
        title="Test Seizure Detection"
      >
        <AlertCircleIcon size={20} />
      </button>
    </Layout>;
};