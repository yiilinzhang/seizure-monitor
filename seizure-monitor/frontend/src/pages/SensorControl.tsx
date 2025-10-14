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
    currentValue: 100,
    mode: 'stopped',
    targetValue: 100
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

  const sendSensorData = async (hrValue: number, spo2Value: number, emgValue: number, menthoneValue: number) => {
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
        emg_level: Math.round(emgValue),
        menthone_resistance: Math.round(menthoneValue * 10) / 10,
      };

      console.log('📤 Sending sensor data:', {
        HR: payload.heart_rate,
        SpO2: payload.spo2,
        EMG: payload.emg_level,
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
            // Normal resting: 60-80 bpm
            newTarget = fluctuate(70, 10);
            newValue = moveTowardTarget(prev.currentValue, newTarget, 0.5);
            newValue = fluctuate(newValue, 2);
          } else if (prev.mode === 'elevated') {
            // Exercise: 120-160 bpm
            newTarget = fluctuate(140, 20);
            newValue = moveTowardTarget(prev.currentValue, newTarget, 2);
            newValue = fluctuate(newValue, 5);
          }

          updatedHR = Math.max(50, Math.min(200, newValue));
          return { ...prev, currentValue: updatedHR, targetValue: newTarget };
        });

        setSpo2(prev => {
          if (!prev.isRunning) return prev;

          let newValue = prev.currentValue;
          let newTarget = prev.targetValue;

          if (prev.mode === 'normal') {
            // Normal: 95-99%
            newTarget = fluctuate(97, 2);
            newValue = moveTowardTarget(prev.currentValue, newTarget, 0.2);
            newValue = fluctuate(newValue, 1);
          } else if (prev.mode === 'elevated') {
            // Exercise (slight drop): 92-96%
            newTarget = fluctuate(94, 2);
            newValue = moveTowardTarget(prev.currentValue, newTarget, 0.3);
            newValue = fluctuate(newValue, 1);
          }

          updatedSpO2 = Math.max(80, Math.min(100, newValue));
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

  // EMG simulation
  useEffect(() => {
    if (emg.isRunning) {
      const intervalId = setInterval(() => {
        setEmg(prev => {
          if (!prev.isRunning) return prev;

          let newValue = prev.currentValue;
          let newTarget = prev.targetValue;

          if (prev.mode === 'normal') {
            // Minimal muscle activity: 50-200 μV
            newTarget = fluctuate(125, 75);
            newValue = moveTowardTarget(prev.currentValue, newTarget, 5);
            newValue = fluctuate(newValue, 20);
          } else if (prev.mode === 'elevated') {
            // High muscle activity: 800-2000 μV
            newTarget = fluctuate(1400, 600);
            newValue = moveTowardTarget(prev.currentValue, newTarget, 50);
            newValue = fluctuate(newValue, 100);
          }

          return { ...prev, currentValue: Math.max(0, Math.min(3000, newValue)), targetValue: newTarget };
        });

        sendSensorData(
          heartRate.currentValue,
          spo2.currentValue,
          emg.currentValue,
          menthone.currentValue
        );
      }, 2000);

      intervalRefs.current['emg'] = intervalId;
      return () => clearInterval(intervalId);
    }
  }, [emg.isRunning, emg.mode]);

  // Menthone simulation
  useEffect(() => {
    if (menthone.isRunning) {
      const intervalId = setInterval(() => {
        setMenthone(prev => {
          if (!prev.isRunning) return prev;

          let newValue = prev.currentValue;
          let newTarget = prev.targetValue;

          if (prev.mode === 'normal') {
            // Baseline: 1-4%
            newTarget = fluctuate(2.5, 1.5);
            newValue = moveTowardTarget(prev.currentValue, newTarget, 0.05);
            newValue = fluctuate(newValue, 0.2);
          } else if (prev.mode === 'elevated') {
            // Pre-seizure buildup: gradually toward 17%
            newTarget = 17;
            newValue = moveTowardTarget(prev.currentValue, newTarget, 0.1);
            newValue = fluctuate(newValue, 0.5);
          }

          return { ...prev, currentValue: Math.max(0, Math.min(50, newValue)), targetValue: newTarget };
        });

        sendSensorData(
          heartRate.currentValue,
          spo2.currentValue,
          emg.currentValue,
          menthone.currentValue
        );
      }, 2000);

      intervalRefs.current['menthone'] = intervalId;
      return () => clearInterval(intervalId);
    }
  }, [menthone.isRunning, menthone.mode]);

  const startReading = (sensorType: string) => {
    if (sensorType === 'heartrate') {
      setHeartRate(prev => ({ ...prev, isRunning: true, mode: 'normal' }));
      setSpo2(prev => ({ ...prev, isRunning: true, mode: 'normal' }));
    } else if (sensorType === 'emg') {
      setEmg(prev => ({ ...prev, isRunning: true, mode: 'normal' }));
    } else if (sensorType === 'menthone') {
      setMenthone(prev => ({ ...prev, isRunning: true, mode: 'normal' }));
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
    } else if (sensorType === 'emg') {
      setEmg(prev => ({ ...prev, mode: 'elevated' }));
    } else if (sensorType === 'menthone') {
      setMenthone(prev => ({ ...prev, mode: 'elevated' }));
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
                {value.toFixed(sensorType === 'menthone' ? 1 : 0)}
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
          unit="μV"
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
