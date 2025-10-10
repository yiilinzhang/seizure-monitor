import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card } from './Card';
import Icon from 'react-native-vector-icons/Feather';

interface TabData {
  id: string;
  title: string;
  data: number[];
  unit: string;
  color: string;
  icon: string;
  currentValue: number;
  normalRange: string;
}

const generateMockData = (baseValue: number, variation: number) => {
  const data = [];
  for (let i = 0; i < 60; i++) {
    const value = baseValue + Math.sin(i / 10) * variation + Math.random() * 5;
    data.push(Math.max(0, value));
  }
  return data;
};

const tabs: TabData[] = [
  {
    id: 'menthone',
    title: 'Menthone',
    data: generateMockData(100, 15),
    unit: 'kΩ',
    color: '#87AEEE',
    icon: 'activity',
    currentValue: 115,
    normalRange: '80-120',
  },
  {
    id: 'heartrate',
    title: 'Heart Rate',
    data: generateMockData(75, 10),
    unit: 'bpm',
    color: '#FF8383',
    icon: 'heart',
    currentValue: 78,
    normalRange: '60-100',
  },
  {
    id: 'spo2',
    title: 'SpO2',
    data: generateMockData(97, 2),
    unit: '%',
    color: '#83D49B',
    icon: 'droplet',
    currentValue: 98,
    normalRange: '95-100',
  },
  {
    id: 'emg',
    title: 'EMG Level',
    data: generateMockData(50, 20),
    unit: 'μV',
    color: '#FFB366',
    icon: 'zap',
    currentValue: 52,
    normalRange: '20-80',
  },
];

export const HealthMetricsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('menthone');
  const screenWidth = Dimensions.get('window').width;

  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];

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
          {tabs.map((tab) => (
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
            {activeTabData.title}
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
                color: activeTabData.color,
              }}
            >
              {activeTabData.currentValue}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#8A8A8A',
              }}
            >
              {activeTabData.unit}
            </Text>
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
            Normal range: {activeTabData.normalRange} {activeTabData.unit}
          </Text>
        </View>

        {/* Chart */}
        <LineChart
          data={{
            labels: [],
            datasets: [
              {
                data: activeTabData.data,
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
              activeTabData.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba'),
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