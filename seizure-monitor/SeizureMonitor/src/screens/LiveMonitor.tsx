import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Layout } from '../components/Layout';
import { Chip } from '../components/Chip';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Toggle } from '../components/Toggle';
import { LineChart } from 'react-native-chart-kit';

const generateMockData = () => {
  const data = [];
  for (let i = 0; i < 60; i++) {
    const baseValue = 100 + Math.sin(i / 10) * 15;
    const noise = Math.random() * 5;
    data.push(baseValue + noise);
  }
  return data;
};

export const LiveMonitor: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [smoothing, setSmoothing] = useState(0.5);
  const [showBaseline, setShowBaseline] = useState(true);
  const [threshold, setThreshold] = useState(15);
  const [duration, setDuration] = useState(5);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(10);

  const chartData = generateMockData();
  const deltaPercent = '+18%';
  const isAlert = true;

  const triggerAlert = () => {
    setShowAlert(true);
    let count = 10;
    const interval = setInterval(() => {
      count--;
      setAlertCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setShowAlert(false);
        setAlertCountdown(10);
      }
    }, 1000);
  };

  const screenWidth = Dimensions.get('window').width;

  return (
    <Layout
      title="Live Monitor"
      rightElement={
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            onPress={() => setShowMenu(!showMenu)}
            style={{
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Icon name="more-vertical" size={20} color="#3D3D3D" />
          </TouchableOpacity>
          {showMenu && (
            <View
              style={{
                position: 'absolute',
                right: 0,
                top: 40,
                width: 150,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
                zIndex: 10,
              }}
            >
              <TouchableOpacity
                style={{ padding: 12 }}
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert('Re-baseline', 'Re-baseline initiated');
                }}
              >
                <Text style={{ fontSize: 14, color: '#3D3D3D' }}>
                  Re-baseline
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 12 }}
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert('Thresholds', 'Set thresholds');
                }}
              >
                <Text style={{ fontSize: 14, color: '#3D3D3D' }}>
                  Set thresholds
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 12 }}
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert('Device Info', 'Device information');
                }}
              >
                <Text style={{ fontSize: 14, color: '#3D3D3D' }}>
                  Device info
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      }
    >
      <View style={{ marginTop: 16 }}>
        <Chip variant="connected" />
      </View>

      <Card style={{ marginTop: 24 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '600',
            color: isAlert ? '#FF8383' : '#83D49B',
          }}
        >
          {deltaPercent}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="activity" size={16} color="#8A8A8A" />
            <Text
              style={{
                fontSize: 14,
                color: '#8A8A8A',
                marginLeft: 4,
              }}
            >
              Baseline: 120 kΩ
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="thermometer" size={16} color="#8A8A8A" />
            <Text
              style={{
                fontSize: 14,
                color: '#8A8A8A',
                marginLeft: 4,
                marginRight: 12,
              }}
            >
              24°C
            </Text>
            <Icon name="droplet" size={16} color="#8A8A8A" />
            <Text
              style={{
                fontSize: 14,
                color: '#8A8A8A',
                marginLeft: 4,
              }}
            >
              45%
            </Text>
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#3D3D3D',
            marginBottom: 16,
          }}
        >
          Menthone (relative)
        </Text>
        <LineChart
          data={{
            labels: [],
            datasets: [
              {
                data: chartData,
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
            color: (opacity = 1) => `rgba(135, 174, 238, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(138, 138, 138, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '0',
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

        <View style={{ marginTop: 16 }}>
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 14, color: '#8A8A8A' }}>
                Smoothing
              </Text>
              <Text style={{ fontSize: 14, color: '#3D3D3D' }}>
                {smoothing.toFixed(1)}
              </Text>
            </View>
            <View
              style={{
                height: 40,
                backgroundColor: '#F0F0F0',
                borderRadius: 8,
                padding: 4,
              }}
            >
              <View
                style={{
                  width: `${smoothing * 100}%`,
                  height: '100%',
                  backgroundColor: '#87AEEE',
                  borderRadius: 6,
                }}
              />
            </View>
          </View>
          <Toggle
            label="Show baseline"
            checked={showBaseline}
            onChange={setShowBaseline}
          />
        </View>
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#3D3D3D',
            marginBottom: 16,
          }}
        >
          Controls
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: '#8A8A8A', marginBottom: 8 }}>
            Threshold: {threshold}%
          </Text>
          <View
            style={{
              height: 40,
              backgroundColor: '#F0F0F0',
              borderRadius: 8,
              padding: 4,
            }}
          >
            <View
              style={{
                width: `${(threshold / 50) * 100}%`,
                height: '100%',
                backgroundColor: '#87AEEE',
                borderRadius: 6,
              }}
            />
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: '#8A8A8A', marginBottom: 8 }}>
            Duration: {duration}s
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(138, 138, 138, 0.2)',
              borderRadius: 12,
              padding: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => setDuration(Math.max(1, duration - 1))}
              style={{ padding: 4 }}
            >
              <Icon name="minus" size={20} color="#8A8A8A" />
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 16,
                color: '#3D3D3D',
              }}
            >
              {duration}
            </Text>
            <TouchableOpacity
              onPress={() => setDuration(Math.min(30, duration + 1))}
              style={{ padding: 4 }}
            >
              <Icon name="plus" size={20} color="#8A8A8A" />
            </TouchableOpacity>
          </View>
        </View>

        <Button onPress={triggerAlert} fullWidth>
          Mark Event (manual)
        </Button>
      </Card>

      {showAlert && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FF8383',
            padding: 16,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 12,
            }}
          >
            Detection ongoing... calling in {alertCountdown}s
          </Text>
          <Button
            variant="secondary"
            onPress={() => setShowAlert(false)}
            fullWidth
          >
            Cancel
          </Button>
        </View>
      )}
    </Layout>
  );
};