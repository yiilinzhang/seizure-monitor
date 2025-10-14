import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { websocketService, SensorData, WebSocketMessage } from '../services/websocket';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

const MAX_DATA_POINTS = 30; // Store last 30 readings for graphs (30 minutes at 1 reading/min)

interface SensorDataContextType {
  // Latest readings
  latestData: SensorData | null;

  // Historical data for graphs (last 30 points)
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
    console.log('📊 UPDATING GRAPHS with:', {
      hr: data.heart_rate,
      spo2: data.spo2,
      menthone: data.menthone_resistance,
      emg: data.emg_level
    });

    setLatestData(data);
    setLastUpdate(new Date());

    // Update historical data arrays
    setHeartRateData((prev) => {
      const newData = addDataPoint(prev, data.heart_rate);
      console.log(`  HR data points: ${newData.length}, latest: ${data.heart_rate}`);
      return newData;
    });
    setSpo2Data((prev) => {
      const newData = addDataPoint(prev, data.spo2);
      console.log(`  SpO2 data points: ${newData.length}, latest: ${data.spo2}`);
      return newData;
    });
    setTemperatureData((prev) => addDataPoint(prev, data.temperature));
    setHumidityData((prev) => addDataPoint(prev, data.humidity));
    setGasResistanceData((prev) => addDataPoint(prev, data.gas_resistance));
    setMenthoneData((prev) => {
      const newData = addDataPoint(prev, data.menthone_resistance);
      console.log(`  Menthone data points: ${newData.length}, latest: ${data.menthone_resistance}`);
      return newData;
    });
    setEmgData((prev) => {
      const newData = addDataPoint(prev, data.emg_level);
      console.log(`  EMG data points: ${newData.length}, latest: ${data.emg_level}`);
      return newData;
    });
  }, []);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'sensor_update' && message.data) {
      handleSensorUpdate(message.data);
    }
  }, [handleSensorUpdate]);

  // Fetch latest reading and add to graph
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('❌ NOT AUTHENTICATED - Cannot fetch data');
      return;
    }

    console.log('🔄 FETCHING SENSOR DATA...');
    setIsLoading(true);
    try {
      // Get the absolute latest reading (always update this)
      const latest = await apiService.getLatestSensorData();
      console.log('✅ Latest data received:', JSON.stringify(latest));

      if (latest && latest.timestamp) {
        // Check if data is fresh (within last 2 minutes to be more lenient)
        const now = Date.now();
        // Parse timestamp as UTC (add 'Z' if not present)
        const timestampStr = latest.timestamp.endsWith('Z') ? latest.timestamp : latest.timestamp + 'Z';
        const dataTimestamp = new Date(timestampStr).getTime();
        const dataAge = now - dataTimestamp;
        const isDataFresh = dataAge < 120000; // 2 minutes (very lenient for testing)

        console.log(`⏰ Now: ${new Date(now).toISOString()}, Data: ${new Date(dataTimestamp).toISOString()}`);
        console.log(`Data age: ${dataAge}ms (${(dataAge / 1000).toFixed(1)}s), fresh: ${isDataFresh}`);
        console.log('Latest data:', JSON.stringify(latest));

        if (isDataFresh) {
          // Update latest data and add to historical arrays
          console.log('Updating with fresh data');
          handleSensorUpdate(latest);
        } else {
          // Data is stale, clear everything
          console.log('Data is stale (older than 2 minutes), clearing...');
          clearData();
        }
      } else {
        // No data at all
        console.log('No data received from API, clearing...');
        clearData();
      }
    } catch (error) {
      console.error('Failed to refresh sensor data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, handleSensorUpdate, clearData]);

  // Fetch initial historical data on mount only
  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      // Fetch last 30 minutes of data to populate graphs
      const history = await apiService.getSensorDataHistory(0.5);

      if (history.readings && history.readings.length > 0) {
        // Check if the most recent data is fresh (within last 2 minutes)
        const latestReading = history.readings[0];
        // Parse timestamp as UTC (add 'Z' if not present)
        const timestampStr = latestReading.timestamp.endsWith('Z') ? latestReading.timestamp : latestReading.timestamp + 'Z';
        const dataAge = Date.now() - new Date(timestampStr).getTime();
        const isDataFresh = dataAge < 120000; // 2 minutes

        console.log(`Historical data age: ${dataAge}ms (${(dataAge / 1000).toFixed(1)}s)`);

        if (!isDataFresh) {
          // Data is too old, don't load it
          console.log('Historical data is stale (older than 2 min), not loading');
          clearData();
          setIsLoading(false);
          return;
        }

        console.log(`Loading ${history.readings.length} historical readings`);

        // Get last 30 readings or all if less
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
      } else {
        // No data available
        clearData();
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, clearData]);

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
      // DISABLED: WebSocket has issues, using polling only
      // websocketService.connect();
      loadInitialData(); // Load historical data once

      // Update connection status
      const checkInterval = setInterval(() => {
        setIsConnected(websocketService.isConnected());
      }, 1000);

      // Auto-refresh latest reading every 4 seconds (primary method)
      const refreshInterval = setInterval(() => {
        refreshData();
      }, 4000);

      return () => {
        clearInterval(checkInterval);
        clearInterval(refreshInterval);
      };
    } else {
      websocketService.disconnect();
      clearData();
      setIsConnected(false);
    }
  }, [isAuthenticated, loadInitialData, refreshData, clearData]);

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
