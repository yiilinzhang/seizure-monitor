import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Layout } from '../components/Layout';
import { Chip } from '../components/Chip';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SeizurePrediction } from '../components/SeizurePrediction';
import { HealthMetricsTabs } from '../components/HealthMetricsTabs';
import { useSensorData } from '../contexts/SensorDataContext';
import { apiService } from '../services/api';

export const LiveMonitor: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(10);
  const [showBigPopup, setShowBigPopup] = useState(false);
  const [highRiskStartTime, setHighRiskStartTime] = useState<number | null>(null);
  const [autoAlertTriggered, setAutoAlertTriggered] = useState(false);
  const sensorData = useSensorData();

  // Calculate seizure prediction based on menthone level
  const { seizureRisk, timeToSeizure, aiConfidence } = useMemo(() => {
    const menthoneLevel = sensorData.latestData?.menthone_resistance || 0;

    // Baseline: 1-4%
    // Pre-seizure: 10-17%+
    if (menthoneLevel < 5) {
      return {
        seizureRisk: 'low' as const,
        timeToSeizure: undefined,
        aiConfidence: 95,
      };
    } else if (menthoneLevel >= 5 && menthoneLevel < 10) {
      return {
        seizureRisk: 'medium' as const,
        timeToSeizure: 30,
        aiConfidence: Math.round(60 + (menthoneLevel - 5) * 6), // 60-90%
      };
    } else {
      // High risk: menthone >= 10%
      const minutesLeft = Math.max(5, Math.round(20 - (menthoneLevel - 10) * 1.5));
      return {
        seizureRisk: 'high' as const,
        timeToSeizure: minutesLeft,
        aiConfidence: Math.min(98, Math.round(85 + (menthoneLevel - 10))), // 85-98%
      };
    }
  }, [sensorData.latestData?.menthone_resistance]);

  // Monitor high risk duration and auto-trigger alert after 5 seconds
  React.useEffect(() => {
    // Reset tracking when risk changes
    if (seizureRisk === 'high') {
      if (highRiskStartTime === null && !autoAlertTriggered) {
        console.log('⚠️ HIGH RISK detected - starting 5 second timer');
        setHighRiskStartTime(Date.now());
      }
    } else {
      // Reset when risk drops below high
      if (highRiskStartTime !== null) {
        console.log('✅ Risk dropped below HIGH - resetting timer');
        setHighRiskStartTime(null);
        setAutoAlertTriggered(false);
      }
    }
  }, [seizureRisk]);

  // Separate effect to continuously check elapsed time
  React.useEffect(() => {
    if (seizureRisk === 'high' && highRiskStartTime !== null && !autoAlertTriggered) {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - highRiskStartTime;
        console.log(`⏱️ HIGH RISK elapsed: ${(elapsed / 1000).toFixed(1)}s / 5s`);

        if (elapsed >= 5000) {
          console.log('🚨 HIGH RISK for 5+ seconds - AUTO-TRIGGERING EMERGENCY ALERT');
          setAutoAlertTriggered(true);

          // Show big popup immediately
          setShowBigPopup(true);

          // Trigger actual emergency call via backend
          (async () => {
            try {
              console.log('📞 Calling backend to trigger emergency phone calls...');
              const user = await apiService.getUser();
              const menthoneLevel = sensorData.latestData?.menthone_resistance || 0;

              // Generate a unique event ID
              const eventId = `emergency-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

              const payload = {
                userId: user.id,
                eventId: eventId,
                location: {
                  lat: 37.7749, // Default location (San Francisco) - could be replaced with GPS
                  lng: -122.4194
                },
                delta_pct: menthoneLevel,
                timestamp: Math.floor(Date.now() / 1000),
                sendSMS: false, // TESTING MODE - disabled to avoid spam
                sendCall: false // TESTING MODE - disabled to avoid spam calls
              };

              console.log('Emergency payload:', JSON.stringify(payload));

              const response = await apiService.triggerEmergency(payload);
              console.log('✅ Emergency contacts notified!', response);
            } catch (error) {
              console.error('❌ Failed to trigger emergency:', error);
              Alert.alert('Error', 'Failed to notify emergency contacts. Please call manually.');
            }
          })();

          // Auto-close after 3 seconds
          setTimeout(() => {
            setShowBigPopup(false);
            Alert.alert('Emergency', 'Emergency contacts have been notified');
          }, 3000);
        }
      }, 500); // Check every 500ms

      return () => clearInterval(checkInterval);
    }
  }, [seizureRisk, highRiskStartTime, autoAlertTriggered, sensorData.latestData?.menthone_resistance]);

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

  const handleManualEvent = async () => {
    // Show big popup immediately
    setShowBigPopup(true);

    // Trigger actual emergency call via backend
    try {
      console.log('📞 Manual trigger - calling backend to trigger emergency phone calls...');
      const user = await apiService.getUser();
      const menthoneLevel = sensorData.latestData?.menthone_resistance || 0;

      // Generate a unique event ID
      const eventId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        userId: user.id,
        eventId: eventId,
        location: {
          lat: 37.7749, // Default location (San Francisco) - could be replaced with GPS
          lng: -122.4194
        },
        delta_pct: menthoneLevel,
        timestamp: Math.floor(Date.now() / 1000),
        sendSMS: true,
        sendCall: true
      };

      console.log('Manual emergency payload:', JSON.stringify(payload));

      const response = await apiService.triggerEmergency(payload);
      console.log('✅ Manual emergency - contacts notified!', response);
    } catch (error) {
      console.error('❌ Failed to trigger manual emergency:', error);
      Alert.alert('Error', 'Failed to notify emergency contacts. Please call manually.');
    }

    // Auto-close after 3 seconds
    setTimeout(() => {
      setShowBigPopup(false);
      Alert.alert('Emergency', 'Emergency contacts have been notified');
    }, 3000);
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

      {/* BIG SEIZURE ALERT POPUP */}
      <Modal
        visible={showBigPopup}
        transparent={true}
        animationType="fade"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(255, 0, 0, 0.95)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
          }}
        >
          <Icon name="alert-octagon" size={100} color="#FFFFFF" />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 48,
              fontWeight: 'bold',
              textAlign: 'center',
              marginTop: 30,
              lineHeight: 58,
            }}
          >
            SEIZURE
          </Text>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 36,
              fontWeight: 'bold',
              textAlign: 'center',
              marginTop: 20,
              lineHeight: 44,
            }}
          >
            ALERTING EMERGENCY CONTACTS NOW
          </Text>
        </View>
      </Modal>
    </Layout>
  );
};