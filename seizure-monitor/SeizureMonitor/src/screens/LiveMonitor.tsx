import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Layout } from '../components/Layout';
import { Chip } from '../components/Chip';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SeizurePrediction } from '../components/SeizurePrediction';
import { HealthMetricsTabs } from '../components/HealthMetricsTabs';

export const LiveMonitor: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(10);

  // Mock data for seizure prediction - in real app this would come from your ML model/API
  const [seizureRisk, setSeizureRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [timeToSeizure, setTimeToSeizure] = useState<number | undefined>(undefined);
  const [aiConfidence, setAiConfidence] = useState(85);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random risk changes for demo
      const random = Math.random();
      if (random < 0.7) {
        setSeizureRisk('low');
        setTimeToSeizure(undefined);
        setAiConfidence(Math.floor(Math.random() * 20) + 75); // 75-95%
      } else if (random < 0.9) {
        setSeizureRisk('medium');
        setTimeToSeizure(Math.floor(Math.random() * 20) + 10); // 10-30 minutes
        setAiConfidence(Math.floor(Math.random() * 15) + 70); // 70-85%
      } else {
        setSeizureRisk('high');
        setTimeToSeizure(Math.floor(Math.random() * 10) + 1); // 1-10 minutes
        setAiConfidence(Math.floor(Math.random() * 10) + 80); // 80-90%
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate fetching new data
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Data Refreshed', 'Latest readings have been updated');
    }, 2000);
  }, []);

  const triggerEmergencyAlert = () => {
    setShowAlert(true);
    let count = 10;
    const interval = setInterval(() => {
      count--;
      setAlertCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setShowAlert(false);
        setAlertCountdown(10);
        Alert.alert('Emergency', 'Emergency contacts have been notified');
      }
    }, 1000);
  };

  const handleManualEvent = () => {
    Alert.alert(
      'Mark Seizure Event',
      'Are you sure you want to manually mark a seizure event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            triggerEmergencyAlert();
          },
        },
      ]
    );
  };

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
                width: 180,
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="refresh-cw" size={16} color="#3D3D3D" />
                  <Text style={{ fontSize: 14, color: '#3D3D3D', marginLeft: 8 }}>
                    Re-baseline
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 12 }}
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert('Thresholds', 'Configure alert thresholds in Settings');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="sliders" size={16} color="#3D3D3D" />
                  <Text style={{ fontSize: 14, color: '#3D3D3D', marginLeft: 8 }}>
                    Set thresholds
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 12 }}
                onPress={() => {
                  setShowMenu(false);
                  Alert.alert(
                    'Device Info',
                    'Device: ESP32\nFirmware: v2.1.0\nBattery: 87%\nSignal: Strong'
                  );
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="info" size={16} color="#3D3D3D" />
                  <Text style={{ fontSize: 14, color: '#3D3D3D', marginLeft: 8 }}>
                    Device info
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#87AEEE"
          />
        }
      >
        {/* Connection Status */}
        <View style={{ marginTop: 16 }}>
          <Chip variant="connected" />
        </View>

        {/* Seizure Prediction Block */}
        <View style={{ marginTop: 24 }}>
          <SeizurePrediction
            riskLevel={seizureRisk}
            timeToSeizure={timeToSeizure}
            confidenceLevel={aiConfidence}
          />
        </View>

        {/* Health Metrics Tabs */}
        <View style={{ marginTop: 24 }}>
          <HealthMetricsTabs />
        </View>

        {/* Quick Actions */}
        <Card style={{ marginTop: 24, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#3D3D3D',
              marginBottom: 16,
            }}
          >
            Quick Actions
          </Text>

          <View style={{ gap: 12 }}>
            <Button onPress={handleManualEvent} fullWidth>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="alert-circle" size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', marginLeft: 8, fontSize: 16, fontWeight: '600' }}>
                  Mark Seizure Event
                </Text>
              </View>
            </Button>

            <TouchableOpacity
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: '#E0E0E0',
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => Alert.alert('Export Data', 'Data export started')}
            >
              <Icon name="download" size={18} color="#8A8A8A" />
              <Text
                style={{
                  color: '#8A8A8A',
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                Export Today's Data
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      {/* Emergency Alert Overlay */}
      {showAlert && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FF8383',
            padding: 16,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Icon name="alert-octagon" size={24} color="#FFFFFF" />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginLeft: 8,
              }}
            >
              Emergency Alert Active
            </Text>
          </View>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            Notifying emergency contacts in {alertCountdown} seconds...
          </Text>
          <Button
            variant="secondary"
            onPress={() => {
              setShowAlert(false);
              setAlertCountdown(10);
            }}
            fullWidth
          >
            Cancel Alert
          </Button>
        </View>
      )}
    </Layout>
  );
};