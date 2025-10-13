import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { websocketService, SensorData, WebSocketMessage } from '../services/websocket';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

const MAX_DATA_POINTS = 60; // Store last 60 readings for graphs

interface SensorDataContextType {
  // Latest readings
  latestData: SensorData | null;

  // Historical data for graphs (last 60 points)
  heartRateData: number[];
  spo2Data: number[];
  temperatureData: number[];
  humidityData: number[];
  gasResistanceData: number[];
  menthoneData: number[];
  emgData: number[];

  // Connection status
  isConnected: boolean;
  isLoading: boolean;
  lastUpdate: Date | null;

  // Actions
  refreshData: () => Promise<void>;
  clearData: () => void;
}

const SensorDataContext = createContext<SensorDataContextType | undefined>(undefined);

export const useSensorData = () => {
  const context = useContext(SensorDataContext);
  if (!context) {
    throw new Error('useSensorData must be used within a SensorDataProvider');
  }
  return context;
};

interface SensorDataProviderProps {
  children: ReactNode;
}

export const SensorDataProvider: React.FC<SensorDataProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [heartRateData, setHeartRateData] = useState<number[]>([]);
  const [spo2Data, setSpo2Data] = useState<number[]>([]);
  const [temperatureData, setTemperatureData] = useState<number[]>([]);
  const [humidityData, setHumidityData] = useState<number[]>([]);
  const [gasResistanceData, setGasResistanceData] = useState<number[]>([]);
  const [menthoneData, setMenthoneData] = useState<number[]>([]);
  const [emgData, setEmgData] = useState<number[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Add data point to array, maintaining max length
  const addDataPoint = (currentData: number[], newValue: number | undefined): number[] => {
    if (newValue === undefined || newValue === null) {
      return currentData;
    }

    const newData = [...currentData, newValue];
    if (newData.length > MAX_DATA_POINTS) {
      newData.shift(); // Remove oldest value
    }
    return newData;
  };

  // Handle incoming sensor data
  const handleSensorUpdate = useCallback((data: SensorData) => {
    setLatestData(data);
    setLastUpdate(new Date());

    // Update historical data arrays
    setHeartRateData((prev) => addDataPoint(prev, data.heart_rate));
    setSpo2Data((prev) => addDataPoint(prev, data.spo2));
    setTemperatureData((prev) => addDataPoint(prev, data.temperature));
    setHumidityData((prev) => addDataPoint(prev, data.humidity));
    setGasResistanceData((prev) => addDataPoint(prev, data.gas_resistance));
    setMenthoneData((prev) => addDataPoint(prev, data.menthone_resistance));
    setEmgData((prev) => addDataPoint(prev, data.emg_level));
  }, []);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'sensor_update' && message.data) {
      handleSensorUpdate(message.data);
    }
  }, [handleSensorUpdate]);

  // Fetch initial historical data
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      // Fetch last hour of data to populate graphs
      const history = await apiService.getSensorDataHistory(1);

      if (history.readings && history.readings.length > 0) {
        // Get last 60 readings or all if less
        const readings = history.readings.slice(0, MAX_DATA_POINTS).reverse();

        // Extract data for each metric
        const hr = readings.map((r: any) => r.heart_rate).filter((v: any) => v !== null);
        const spo2 = readings.map((r: any) => r.spo2).filter((v: any) => v !== null);
        const temp = readings.map((r: any) => r.temperature).filter((v: any) => v !== null);
        const humid = readings.map((r: any) => r.humidity).filter((v: any) => v !== null);
        const gas = readings.map((r: any) => r.gas_resistance).filter((v: any) => v !== null);
        const menthone = readings.map((r: any) => r.menthone_resistance).filter((v: any) => v !== null);
        const emg = readings.map((r: any) => r.emg_level).filter((v: any) => v !== null);

        setHeartRateData(hr);
        setSpo2Data(spo2);
        setTemperatureData(temp);
        setHumidityData(humid);
        setGasResistanceData(gas);
        setMenthoneData(menthone);
        setEmgData(emg);

        // Set latest data
        if (readings.length > 0) {
          setLatestData(readings[readings.length - 1]);
          setLastUpdate(new Date());
        }
      }

      // Also get the absolute latest reading
      const latest = await apiService.getLatestSensorData();
      if (latest && latest.timestamp) {
        setLatestData(latest);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh sensor data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Clear all data
  const clearData = useCallback(() => {
    setLatestData(null);
    setHeartRateData([]);
    setSpo2Data([]);
    setTemperatureData([]);
    setHumidityData([]);
    setGasResistanceData([]);
    setMenthoneData([]);
    setEmgData([]);
    setLastUpdate(null);
  }, []);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      websocketService.connect();
      refreshData(); // Fetch initial data

      // Update connection status
      const checkInterval = setInterval(() => {
        setIsConnected(websocketService.isConnected());
      }, 1000);

      return () => {
        clearInterval(checkInterval);
      };
    } else {
      websocketService.disconnect();
      clearData();
      setIsConnected(false);
    }
  }, [isAuthenticated, refreshData, clearData]);

  // Subscribe to WebSocket messages
  useEffect(() => {
    websocketService.addMessageHandler(handleWebSocketMessage);

    return () => {
      websocketService.removeMessageHandler(handleWebSocketMessage);
    };
  }, [handleWebSocketMessage]);

  const value: SensorDataContextType = {
    latestData,
    heartRateData,
    spo2Data,
    temperatureData,
    humidityData,
    gasResistanceData,
    menthoneData,
    emgData,
    isConnected,
    isLoading,
    lastUpdate,
    refreshData,
    clearData,
  };

  return (
    <SensorDataContext.Provider value={value}>
      {children}
    </SensorDataContext.Provider>
  );
};
