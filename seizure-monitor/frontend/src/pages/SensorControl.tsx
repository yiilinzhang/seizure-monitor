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

  const sendSensorData = async (hrValue: number | null, spo2Value: number | null, emgPercentage: number | null, menthoneValue: number | null) => {
    try {
      const token = localStorage.getItem('authToken');

      // Don't send if not authenticated
      if (!token) {
        console.warn('❌ No auth token - skipping sensor data send');
        return;
      }

      // Build payload - send null for stopped sensors so backend knows to clear them
      const payload: any = {
        device_id: 'WEB_CONTROLLER',
        battery_level: 100,
        signal_quality: 100,
        heart_rate: hrValue !== null ? Math.round(hrValue) : null,
        spo2: spo2Value !== null ? Math.round(spo2Value) : null,
        emg_level: emgPercentage !== null ? Math.round(emgPercentage) : null,
        menthone_resistance: menthoneValue !== null ? Math.round(menthoneValue * 10) / 10 : null,
      }

      console.log('📤 Sending sensor data:', {
        HR: payload.heart_rate ?? 'stopped',
        SpO2: payload.spo2 ?? 'stopped',
        'EMG': payload.emg_level !== undefined ? `${payload.emg_level}%` : 'stopped',
        Menthone: payload.menthone_resistance ?? 'stopped'
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

        // Send combined data - only send values for running sensors
        setTimeout(() => {
          sendSensorData(
            updatedHR,
            updatedSpO2,
            emg.isRunning ? emg.currentValue : null,
            menthone.isRunning ? menthone.currentValue : null
          );
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
          sendSensorData(
            heartRate.isRunning ? heartRate.currentValue : null,
            spo2.isRunning ? spo2.currentValue : null,
            updatedEMG,
            menthone.isRunning ? menthone.currentValue : null
          );
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
            // If coming down from elevated mode, slowly decrease
            if (prev.currentValue > 5) {
              // Gradually drop with jagged pattern
              const isDecrease = Math.random() > 0.2; // 80% chance of decrease
              if (isDecrease) {
                const drop = 0.5 + Math.random() * 1.5; // -0.5 to -2%
                newValue = prev.currentValue - drop;
                console.log('  Cooling down - decreasing by', drop, 'to', newValue);
              } else {
                const smallJump = 0.2 + Math.random() * 0.8; // +0.2 to +1% (occasional small rises)
                newValue = prev.currentValue + smallJump;
                console.log('  Cooling down - small rise by', smallJump, 'to', newValue);
              }
              // Add jitter
              newValue = fluctuate(newValue, 0.4);
            } else {
              // Already at baseline, just fluctuate normally
              newValue = fluctuate(2.5, 1); // Random around 2.5 +/- 1
              newValue = fluctuate(newValue, 0.5); // Add extra jitter
            }
          } else if (prev.mode === 'elevated') {
            console.log('⚠️ Menthone in ELEVATED mode, current:', prev.currentValue);
            // Check if we're near the cap (19.7%)
            if (prev.currentValue >= 19.7) {
              // Hover around 19.7% - go up a bit, down a bit
              const smallChange = (Math.random() - 0.5) * 1.2; // -0.6 to +0.6% - more jagged
              newValue = prev.currentValue + smallChange;
              console.log('  At cap, hovering. New value:', newValue);
            } else {
              // Pre-seizure buildup: VERY JAGGED, SLOWER increase toward 19.7%
              // Random walk with big jumps up and down
              const isIncrease = Math.random() > 0.35; // 65% chance of increase (was 75%)
              if (isIncrease) {
                const jump = 1 + Math.random() * 1; // +1 to +2% (HALF SPEED - was +2 to +4%)
                newValue = prev.currentValue + jump;
                console.log('  Increasing by', jump, 'to', newValue);
              } else {
                const drop = 0.3 + Math.random() * 1.2; // -0.3 to -1.5% (more jagged drops)
                newValue = prev.currentValue - drop;
                console.log('  Decreasing by', drop, 'to', newValue);
              }
              // Add BIGGER jitter for more jaggedness
              newValue = fluctuate(newValue, 0.6);
            }
          }

          // Hard cap at 19.7%
          updatedMenthone = Math.max(0, Math.min(19.7, newValue));
          return { ...prev, currentValue: updatedMenthone, targetValue: newTarget };
        });

        setTimeout(() => {
          sendSensorData(
            heartRate.isRunning ? heartRate.currentValue : null,
            spo2.isRunning ? spo2.currentValue : null,
            emg.isRunning ? emg.currentValue : null,
            updatedMenthone
          );
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
      setHeartRate(prev => ({ ...prev, mode: 'elevated', isRunning: true }));
      setSpo2(prev => ({ ...prev, mode: 'elevated', isRunning: true }));
      console.log('🔥 Heart Rate & SpO2 set to ELEVATED mode (auto-started)');
    } else if (sensorType === 'emg') {
      setEmg(prev => ({ ...prev, mode: 'elevated', isRunning: true }));
      console.log('🔥 EMG set to ELEVATED mode (auto-started)');
    } else if (sensorType === 'menthone') {
      setMenthone(prev => {
        console.log('🔥🔥🔥 MENTHONE BUTTON CLICKED - SETTING TO ELEVATED 🔥🔥🔥');
        console.log('   Current value:', prev.currentValue);
        console.log('   Was running:', prev.isRunning);
        console.log('   Old mode:', prev.mode);
        const newState = { ...prev, mode: 'elevated' as SimulationMode, isRunning: true };
        console.log('   New mode:', newState.mode, '- AUTO-STARTED');
        return newState;
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
