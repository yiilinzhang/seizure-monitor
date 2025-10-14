import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Plus, Minus } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

type SimulationMode = 'stopped' | 'normal' | 'elevated';

interface SensorState {
  isRunning: boolean;
  currentValue: number;
  mode: SimulationMode;
  targetValue: number; // For gradual transitions
}

export const SensorControl: React.FC = () => {
  const [heartRate, setHeartRate] = useState<SensorState>({
    isRunning: false,
    currentValue: 70,
    mode: 'stopped',
    targetValue: 70
  });
  const [spo2, setSpo2] = useState<SensorState>({
    isRunning: false,
    currentValue: 97,
    mode: 'stopped',
    targetValue: 97
  });
  const [emg, setEmg] = useState<SensorState>({
    isRunning: false,
    currentValue: 6, // Start at 6% (minimal activity)
    mode: 'stopped',
    targetValue: 6
  });
  const [menthone, setMenthone] = useState<SensorState>({
    isRunning: false,
    currentValue: 2,
    mode: 'stopped',
    targetValue: 2
  });

  const intervalRefs = useRef<{ [key: string]: NodeJS.Timeout | null }>({});

  // Generate random fluctuation
  const fluctuate = (base: number, variance: number): number => {
    return base + (Math.random() - 0.5) * 2 * variance;
  };

  // Smoothly transition current value toward target
  const moveTowardTarget = (current: number, target: number, step: number): number => {
    if (Math.abs(target - current) < step) return target;
    return current < target ? current + step : current - step;
  };

  const sendSensorData = async (hrValue: number, spo2Value: number, emgPercentage: number, menthoneValue: number) => {
    try {
      const token = localStorage.getItem('authToken');

      // Don't send if not authenticated
      if (!token) {
        console.warn('❌ No auth token - skipping sensor data send');
        return;
      }

      const payload = {
        device_id: 'WEB_CONTROLLER',
        battery_level: 100,
        signal_quality: 100,
        heart_rate: Math.round(hrValue),
        spo2: Math.round(spo2Value),
        emg_level: Math.round(emgPercentage), // Send percentage (0-100)
        menthone_resistance: Math.round(menthoneValue * 10) / 10,
      };

      console.log('📤 Sending sensor data:', {
        HR: payload.heart_rate,
        SpO2: payload.spo2,
        'EMG': `${payload.emg_level}%`,
        Menthone: payload.menthone_resistance
      });

      const response = await fetch('http://localhost:8000/api/v1/sensor-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send sensor data:', response.status, errorText);
        console.error('   Payload was:', payload);
      } else {
        const responseData = await response.json();
        console.log('✅ Sensor data sent successfully! Server response:', responseData);
      }
    } catch (error) {
      console.error('❌ Error sending sensor data:', error);
    }
  };

  // Heart Rate & SpO2 simulation (same sensor)
  useEffect(() => {
    if (heartRate.isRunning) {
      const intervalId = setInterval(() => {
        let updatedHR = 0;
        let updatedSpO2 = 0;

        setHeartRate(prev => {
          if (!prev.isRunning) return prev;

          let newValue = prev.currentValue;
          let newTarget = prev.targetValue;

          if (prev.mode === 'normal') {
            // Normal resting: 60-80 bpm - MORE JAGGED
            newValue = fluctuate(70, 5); // Random around 70 +/- 5
            newValue = fluctuate(newValue, 3); // Add extra jitter
          } else if (prev.mode === 'elevated') {
            // Exercise: 120-160 bpm - MORE JAGGED
            newValue = fluctuate(140, 15); // Random around 140 +/- 15
            newValue = fluctuate(newValue, 8); // Add extra jitter
          }

          updatedHR = Math.max(50, Math.min(200, newValue));
          return { ...prev, currentValue: updatedHR, targetValue: newTarget };
        });

        setSpo2(prev => {
          if (!prev.isRunning) return prev;

          let newValue = prev.currentValue;
          let newTarget = prev.targetValue;

          if (prev.mode === 'normal') {
            // Normal: 95-99% - MORE JAGGED
            newValue = fluctuate(97, 2); // Random around 97 +/- 2
            newValue = fluctuate(newValue, 1.5); // Add extra jitter
          } else if (prev.mode === 'elevated') {
            // Exercise (slight drop): 95-98% - MORE JAGGED, never below 95%
            newValue = fluctuate(96.5, 1.5); // Random around 96.5 +/- 1.5
            newValue = fluctuate(newValue, 1); // Add extra jitter
          }

          // Never go below 95%
          updatedSpO2 = Math.max(95, Math.min(100, newValue));
          return { ...prev, currentValue: updatedSpO2, targetValue: newTarget };
        });

        // Send combined data using updated values
        setTimeout(() => {
          sendSensorData(updatedHR, updatedSpO2, emg.currentValue, menthone.currentValue);
        }, 100);
      }, 2000);

      intervalRefs.current['heartrate'] = intervalId;
      return () => clearInterval(intervalId);
    }
  }, [heartRate.isRunning, heartRate.mode, emg.currentValue, menthone.currentValue]);

  // EMG simulation (as percentage of 4095)
  useEffect(() => {
    if (emg.isRunning) {
      const intervalId = setInterval(() => {
        let updatedEMG = 0;

        setEmg(prev => {
          if (!prev.isRunning) return prev;

          let newValue = prev.currentValue;
          let newTarget = prev.targetValue;

          if (prev.mode === 'normal') {
            // Minimal muscle activity: 2-12% with natural variation
            // Create a new random target each time for natural drift
            newTarget = fluctuate(7, 5);
            newValue = moveTowardTarget(prev.currentValue, newTarget, 0.8);
            // Add more random noise for natural jitter
            newValue = fluctuate(newValue, 2.5);
          } else if (prev.mode === 'elevated') {
            // High muscle activity: 25-65% with strong variation
            newTarget = fluctuate(45, 20);
            newValue = moveTowardTarget(prev.currentValue, newTarget, 3);
            // More dramatic fluctuations during elevated activity
            newValue = fluctuate(newValue, 8);
          }

          updatedEMG = Math.max(0, Math.min(100, newValue));
          return { ...prev, currentValue: updatedEMG, targetValue: newTarget };
        });

        setTimeout(() => {
          sendSensorData(heartRate.currentValue, spo2.currentValue, updatedEMG, menthone.currentValue);
        }, 100);
      }, 2000);

      intervalRefs.current['emg'] = intervalId;
      return () => clearInterval(intervalId);
    }
  }, [emg.isRunning, emg.mode, heartRate.currentValue, spo2.currentValue, menthone.currentValue]);

  // Menthone simulation
  useEffect(() => {
    if (menthone.isRunning) {
      const intervalId = setInterval(() => {
        let updatedMenthone = 0;

        setMenthone(prev => {
          if (!prev.isRunning) return prev;

          let newValue = prev.currentValue;
          let newTarget = prev.targetValue;

          if (prev.mode === 'normal') {
            // Baseline: 1-4% - MORE JAGGED
            newValue = fluctuate(2.5, 1); // Random around 2.5 +/- 1
            newValue = fluctuate(newValue, 0.5); // Add extra jitter
          } else if (prev.mode === 'elevated') {
            console.log('⚠️ Menthone in ELEVATED mode, current:', prev.currentValue);
            // Check if we're near the cap (19.7%)
            if (prev.currentValue >= 19.7) {
              // Hover around 19.7% - go up a bit, down a bit
              const smallChange = (Math.random() - 0.5) * 0.8; // -0.4 to +0.4%
              newValue = prev.currentValue + smallChange;
              console.log('  At cap, hovering. New value:', newValue);
            } else {
              // Pre-seizure buildup: JAGGED rapid increase toward 19.7%
              // Add random jump: mostly up (2-4%), sometimes down (1-2%)
              const isIncrease = Math.random() > 0.25; // 75% chance of increase
              if (isIncrease) {
                const jump = 2 + Math.random() * 2; // +2 to +4%
                newValue = prev.currentValue + jump;
                console.log('  Increasing by', jump, 'to', newValue);
              } else {
                const drop = 0.5 + Math.random() * 1.5; // -0.5 to -2%
                newValue = prev.currentValue - drop;
                console.log('  Decreasing by', drop, 'to', newValue);
              }
              // Add small jitter
              newValue = fluctuate(newValue, 0.3);
            }
          }

          // Hard cap at 19.7%
          updatedMenthone = Math.max(0, Math.min(19.7, newValue));
          return { ...prev, currentValue: updatedMenthone, targetValue: newTarget };
        });

        setTimeout(() => {
          sendSensorData(heartRate.currentValue, spo2.currentValue, emg.currentValue, updatedMenthone);
        }, 100);
      }, 2000);

      intervalRefs.current['menthone'] = intervalId;
      return () => clearInterval(intervalId);
    }
  }, [menthone.isRunning, menthone.mode, heartRate.currentValue, spo2.currentValue, emg.currentValue]);

  const startReading = (sensorType: string) => {
    if (sensorType === 'heartrate') {
      setHeartRate(prev => ({ ...prev, isRunning: true, mode: 'normal' }));
      setSpo2(prev => ({ ...prev, isRunning: true, mode: 'normal' }));
      console.log('▶️ Heart Rate & SpO2 STARTED');
    } else if (sensorType === 'emg') {
      setEmg(prev => ({ ...prev, isRunning: true, mode: 'normal' }));
      console.log('▶️ EMG STARTED');
    } else if (sensorType === 'menthone') {
      setMenthone(prev => ({ ...prev, isRunning: true, mode: 'normal' }));
      console.log('▶️ Menthone STARTED');
    }
  };

  const stopReading = (sensorType: string) => {
    if (sensorType === 'heartrate') {
      setHeartRate(prev => ({ ...prev, isRunning: false, mode: 'stopped' }));
      setSpo2(prev => ({ ...prev, isRunning: false, mode: 'stopped' }));
    } else if (sensorType === 'emg') {
      setEmg(prev => ({ ...prev, isRunning: false, mode: 'stopped' }));
    } else if (sensorType === 'menthone') {
      setMenthone(prev => ({ ...prev, isRunning: false, mode: 'stopped' }));
    }
  };

  const setElevatedMode = (sensorType: string) => {
    if (sensorType === 'heartrate') {
      setHeartRate(prev => ({ ...prev, mode: 'elevated' }));
      setSpo2(prev => ({ ...prev, mode: 'elevated' }));
      console.log('🔥 Heart Rate & SpO2 set to ELEVATED mode');
    } else if (sensorType === 'emg') {
      setEmg(prev => ({ ...prev, mode: 'elevated' }));
      console.log('🔥 EMG set to ELEVATED mode');
    } else if (sensorType === 'menthone') {
      setMenthone(prev => {
        console.log('🔥 Menthone set to ELEVATED mode - current value:', prev.currentValue, 'isRunning:', prev.isRunning);
        return { ...prev, mode: 'elevated' };
      });
    }
  };

  const setNormalMode = (sensorType: string) => {
    if (sensorType === 'heartrate') {
      setHeartRate(prev => ({ ...prev, mode: 'normal' }));
      setSpo2(prev => ({ ...prev, mode: 'normal' }));
    } else if (sensorType === 'emg') {
      setEmg(prev => ({ ...prev, mode: 'normal' }));
    } else if (sensorType === 'menthone') {
      setMenthone(prev => ({ ...prev, mode: 'normal' }));
    }
  };

  const SensorControlCard = ({
    title,
    value,
    secondaryValue,
    unit,
    secondaryUnit,
    state,
    sensorType,
    color
  }: {
    title: string;
    value: number;
    secondaryValue?: number;
    unit: string;
    secondaryUnit?: string;
    state: SensorState;
    sensorType: string;
    color: string;
  }) => {
    const getModeLabel = () => {
      if (!state.isRunning) return 'Stopped';
      if (state.mode === 'normal') return 'Normal';
      if (state.mode === 'elevated') return 'Elevated';
      return 'Active';
    };

    const getModeColor = () => {
      if (!state.isRunning) return 'bg-gray-100 text-gray-600';
      if (state.mode === 'normal') return 'bg-green-100 text-green-700';
      if (state.mode === 'elevated') return 'bg-orange-100 text-orange-700';
      return 'bg-blue-100 text-blue-700';
    };

    return (
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 font-semibold text-ink-100">{title}</h2>
          <div className={`px-3 py-1 rounded-full text-bodySmall font-medium ${getModeColor()}`}>
            {getModeLabel()}
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4">
            <div>
              <div className={`text-6xl font-bold mb-2`} style={{ color }}>
                {value.toFixed(sensorType === 'menthone' || sensorType === 'emg' ? 1 : 0)}
              </div>
              <div className="text-bodySmall text-ink-60">{unit}</div>
            </div>
            {secondaryValue !== undefined && (
              <div>
                <div className={`text-4xl font-bold mb-2`} style={{ color: '#83D49B' }}>
                  {secondaryValue.toFixed(0)}
                </div>
                <div className="text-bodySmall text-ink-60">{secondaryUnit}</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            onClick={() => setNormalMode(sensorType)}
            variant="outline"
            className="flex items-center justify-center gap-2"
            disabled={!state.isRunning}
          >
            <Minus size={16} />
            Normal
          </Button>
          <Button
            onClick={() => setElevatedMode(sensorType)}
            variant="outline"
            className="flex items-center justify-center gap-2"
            disabled={!state.isRunning}
          >
            <Plus size={16} />
            Elevated
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => startReading(sensorType)}
            disabled={state.isRunning}
            className="flex items-center justify-center gap-2"
            style={{ backgroundColor: state.isRunning ? '#ccc' : color }}
          >
            <Play size={16} />
            Start
          </Button>
          <Button
            onClick={() => stopReading(sensorType)}
            disabled={!state.isRunning}
            variant="outline"
            className="flex items-center justify-center gap-2 border-red-500 text-red-500 hover:bg-red-50"
          >
            <Square size={16} />
            Stop
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <Layout title="Sensor Control Panel">
      <div className="mt-6 mb-4">
        <p className="text-body text-ink-60">
          Simulate realistic sensor readings. <strong>Start</strong> begins normal readings, <strong>Elevated</strong> simulates exercise/pre-seizure conditions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SensorControlCard
          title="Heart Rate & SpO2"
          value={heartRate.currentValue}
          secondaryValue={spo2.currentValue}
          unit="bpm"
          secondaryUnit="%"
          state={heartRate}
          sensorType="heartrate"
          color="#FF8383"
        />

        <SensorControlCard
          title="EMG Level"
          value={emg.currentValue}
          unit="%"
          state={emg}
          sensorType="emg"
          color="#FFB366"
        />

        <SensorControlCard
          title="Menthone Level"
          value={menthone.currentValue}
          unit="%"
          state={menthone}
          sensorType="menthone"
          color="#87AEEE"
        />
      </div>
    </Layout>
  );
};
