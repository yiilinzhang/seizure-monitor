import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const generateMockData = () => {
  const data = [];
  for (let i = 0; i < 60; i++) {
    const baseValue = 100 + Math.sin(i / 10) * 15;
    const noise = Math.random() * 5;
    data.push({
      time: i,
      value: baseValue + noise,
    });
  }
  return data;
};

export const LiveMonitorScreen: React.FC = () => {
  const [smoothing, setSmoothing] = useState(0.5);
  const [showBaseline, setShowBaseline] = useState(true);
  const [threshold, setThreshold] = useState(15);
  const [duration, setDuration] = useState(5);

  const chartData = generateMockData();
  const deltaPercent = '+18%';
  const baseline = 120;
  const temperature = 24;
  const humidity = 45;

  return (
    <ScrollView style={styles.container}>
      {/* Status Chips */}
      <View style={styles.statusContainer}>
        <View style={[styles.chip, styles.chipSuccess]}>
          <Text style={styles.chipText}>Connected</Text>
        </View>
        <View style={[styles.chip, styles.chipAlert]}>
          <Text style={styles.chipText}>{deltaPercent}</Text>
        </View>
      </View>

      {/* Sensor Info */}
      <View style={styles.sensorInfo}>
        <View style={styles.sensorRow}>
          <Text style={styles.sensorLabel}>⚡ Baseline:</Text>
          <Text style={styles.sensorValue}>{baseline} kΩ</Text>
        </View>
        <View style={styles.sensorRow}>
          <Text style={styles.sensorLabel}>🌡 {temperature}°C</Text>
          <Text style={styles.sensorValue}>{humidity}%</Text>
        </View>
      </View>

      {/* Chart Section */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Menthone (relative)</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>Chart will render here</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsCard}>
        <Text style={styles.controlsTitle}>Controls</Text>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Threshold</Text>
          <Text style={styles.controlValue}>{threshold}</Text>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Duration (seconds)</Text>
          <View style={styles.durationControls}>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setDuration(Math.max(1, duration - 1))}>
              <Text style={styles.durationButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.durationValue}>{duration}s</Text>
            <TouchableOpacity
              style={styles.durationButton}
              onPress={() => setDuration(duration + 1)}>
              <Text style={styles.durationButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.markButton}>
          <Text style={styles.markButtonText}>Mark Event (manual)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EE',
  },
  statusContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipSuccess: {
    backgroundColor: '#83D49B',
  },
  chipAlert: {
    backgroundColor: '#FF8383',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sensorInfo: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sensorLabel: {
    fontSize: 14,
    color: '#8A8A8A',
  },
  sensorValue: {
    fontSize: 14,
    color: '#3D3D3D',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3D3D3D',
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#F5F2EE',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    color: '#8A8A8A',
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3D3D3D',
    marginBottom: 16,
  },
  controlGroup: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    color: '#8A8A8A',
    marginBottom: 8,
  },
  controlValue: {
    fontSize: 16,
    color: '#3D3D3D',
    fontWeight: '600',
  },
  durationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  durationButton: {
    width: 40,
    height: 40,
    backgroundColor: '#87AEEE',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  durationValue: {
    fontSize: 16,
    color: '#3D3D3D',
    fontWeight: '600',
  },
  markButton: {
    backgroundColor: '#87AEEE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  markButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
