import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
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
}

const tabConfigs: TabConfig[] = [
  {
    id: 'menthone',
    title: 'Menthone',
    unit: 'kΩ',
    color: '#87AEEE',
    icon: 'activity',
    normalRange: '80-120',
    dataKey: 'menthoneData',
  },
  {
    id: 'heartrate',
    title: 'Heart Rate',
    unit: 'bpm',
    color: '#FF8383',
    icon: 'heart',
    normalRange: '60-100',
    dataKey: 'heartRateData',
  },
  {
    id: 'spo2',
    title: 'SpO2',
    unit: '%',
    color: '#83D49B',
    icon: 'droplet',
    normalRange: '95-100',
    dataKey: 'spo2Data',
  },
  {
    id: 'emg',
    title: 'EMG Level',
    unit: 'μV',
    color: '#FFB366',
    icon: 'zap',
    normalRange: '20-80',
    dataKey: 'emgData',
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

  // Get data and current value for active tab
  const data = useMemo(() => {
    const dataArray = sensorData[activeTabConfig.dataKey] as number[];
    return dataArray && dataArray.length > 0 ? dataArray : [0];
  }, [sensorData, activeTabConfig.dataKey]);

  const currentValue = useMemo(() => {
    if (data.length > 1 && data[data.length - 1] !== 0) {
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
            {sensorData.isLoading ? (
              <ActivityIndicator size="small" color={activeTabConfig.color} />
            ) : (
              <>
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
              </>
            )}
          </View>
        </View>

        {/* Normal Range Indicator */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: '#F5F5F5',
            borderRadius: 12,
          }}
        >
          <Icon name="info" size={14} color="#8A8A8A" />
          <Text
            style={{
              fontSize: 12,
              color: '#8A8A8A',
              marginLeft: 6,
            }}
          >
            Normal range: {activeTabConfig.normalRange} {activeTabConfig.unit}
          </Text>
        </View>

        {/* Chart */}
        {data.length > 0 ? (
          <LineChart
            data={{
              labels: [],
              datasets: [
                {
                  data: data,
                },
              ],
            }}
            width={screenWidth - 64}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) =>
                activeTabConfig.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba'),
              labelColor: (opacity = 1) => `rgba(138, 138, 138, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '0',
              },
              propsForBackgroundLines: {
                strokeDasharray: '5, 5',
                stroke: '#F0F0F0',
                strokeWidth: 1,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            withInnerLines={true}
            withOuterLines={false}
            withHorizontalLabels={true}
            withVerticalLabels={false}
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
            60 min ago
          </Text>
          <Text style={{ fontSize: 11, color: '#B0B0B0' }}>
            30 min ago
          </Text>
          <Text style={{ fontSize: 11, color: '#B0B0B0' }}>
            Now
          </Text>
        </View>
      </Card>
    </View>
  );
};