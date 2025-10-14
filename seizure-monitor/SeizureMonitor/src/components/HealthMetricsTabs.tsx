import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SimpleLineChart } from './SimpleLineChart';
import { Card } from './Card';
import Icon from 'react-native-vector-icons/Feather';
import { useSensorData } from '../contexts/SensorDataContext';

interface TabConfig {
  id: string;
  title: string;
  unit: string;
  color: string;
  icon: string;
  normalRange: string;
  dataKey: keyof ReturnType<typeof useSensorData>;
  yMin: number;
  yMax: number;
}

const tabConfigs: TabConfig[] = [
  {
    id: 'menthone',
    title: 'Menthone',
    unit: '%',
    color: '#87AEEE',
    icon: 'activity',
    normalRange: '1-4',
    dataKey: 'menthoneData',
    yMin: 0,
    yMax: 20,
  },
  {
    id: 'heartrate',
    title: 'Heart Rate',
    unit: 'bpm',
    color: '#FF8383',
    icon: 'heart',
    normalRange: '60-100',
    dataKey: 'heartRateData',
    yMin: 60,
    yMax: 100,
  },
  {
    id: 'spo2',
    title: 'SpO2',
    unit: '%',
    color: '#83D49B',
    icon: 'droplet',
    normalRange: '80-100',
    dataKey: 'spo2Data',
    yMin: 80,
    yMax: 100,
  },
  {
    id: 'emg',
    title: 'EMG Level',
    unit: '%',
    color: '#FFB366',
    icon: 'zap',
    normalRange: '0-100',
    dataKey: 'emgData',
    yMin: 0,
    yMax: 100,
  },
];

export const HealthMetricsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('menthone');
  const screenWidth = Dimensions.get('window').width;
  const sensorData = useSensorData();

  const activeTabConfig = useMemo(() =>
    tabConfigs.find(tab => tab.id === activeTab) || tabConfigs[0],
    [activeTab]
  );

  // Smoothing function - simple moving average
  const smoothData = (rawData: number[], windowSize: number = 5): number[] => {
    if (rawData.length < windowSize) return rawData;

    const smoothed: number[] = [];
    for (let i = 0; i < rawData.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(rawData.length, i + Math.ceil(windowSize / 2));
      const window = rawData.slice(start, end);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      smoothed.push(average);
    }
    return smoothed;
  };

  // Get data and current value for active tab
  const data = useMemo(() => {
    const dataArray = sensorData[activeTabConfig.dataKey] as number[];
    if (!dataArray || dataArray.length === 0) return [];

    // Apply smoothing to reduce noise
    return smoothData(dataArray, 5);
  }, [sensorData, activeTabConfig.dataKey]);

  // Just use actual data - custom chart handles fixed scale
  const chartData = useMemo(() => {
    return data;
  }, [data]);

  const currentValue = useMemo(() => {
    if (data.length > 0 && data[data.length - 1] !== 0) {
      return data[data.length - 1];
    }
    // Fallback to latest data from sensor
    if (sensorData.latestData) {
      const fieldMap: Record<string, keyof typeof sensorData.latestData> = {
        'menthone': 'menthone_resistance',
        'heartrate': 'heart_rate',
        'spo2': 'spo2',
        'emg': 'emg_level',
      };
      const field = fieldMap[activeTab];
      return sensorData.latestData[field] || 0;
    }
    return 0;
  }, [data, sensorData.latestData, activeTab]);

  return (
    <View>
      {/* Tab Headers */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            gap: 12,
          }}
        >
          {tabConfigs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor:
                  activeTab === tab.id ? tab.color : '#F0F0F0',
                borderWidth: activeTab === tab.id ? 0 : 1,
                borderColor: '#E0E0E0',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon
                  name={tab.icon}
                  size={16}
                  color={activeTab === tab.id ? '#FFFFFF' : '#8A8A8A'}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: activeTab === tab.id ? '#FFFFFF' : '#8A8A8A',
                  }}
                >
                  {tab.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Graph Card */}
      <Card>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#3D3D3D',
            }}
          >
            {activeTabConfig.title}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 4,
            }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: activeTabConfig.color,
              }}
            >
              {currentValue ? Math.round(currentValue * 10) / 10 : '--'}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#8A8A8A',
              }}
            >
              {activeTabConfig.unit}
            </Text>
          </View>
        </View>

        {/* Chart */}
        {data.length > 0 ? (
          <SimpleLineChart
            data={chartData}
            width={screenWidth - 64}
            height={200}
            yMin={activeTabConfig.yMin}
            yMax={activeTabConfig.yMax}
            color={activeTabConfig.color}
          />
        ) : (
          <View
            style={{
              height: 200,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon name="activity" size={48} color="#E0E0E0" />
            <Text style={{ color: '#8A8A8A', marginTop: 12 }}>
              {sensorData.isLoading ? 'Loading data...' : 'No data available'}
            </Text>
            {!sensorData.isConnected && !sensorData.isLoading && (
              <Text style={{ color: '#8A8A8A', fontSize: 12, marginTop: 4 }}>
                Waiting for sensor connection
              </Text>
            )}
          </View>
        )}

        {/* Time Range Indicator */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 11, color: '#B0B0B0' }}>
            30 min ago
          </Text>
          <Text style={{ fontSize: 11, color: '#B0B0B0' }}>
            15 min ago
          </Text>
          <Text style={{ fontSize: 11, color: '#B0B0B0' }}>
            Now
          </Text>
        </View>
      </Card>
    </View>
  );
};