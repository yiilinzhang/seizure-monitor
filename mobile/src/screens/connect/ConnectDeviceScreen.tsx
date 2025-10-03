import React, {useState} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import {Layout} from '../../components/common/Layout';
import {Card} from '../../components/common/Card';
import {Button} from '../../components/common/Button';
import {Chip} from '../../components/common/Chip';
import {colors} from '../../utils/colors';

export const ConnectDeviceScreen: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      Alert.alert(
        'Success',
        'Successfully connected to MethoneSense-ESP32',
        [{text: 'OK'}]
      );
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handleTroubleshoot = () => {
    Alert.alert(
      'Troubleshooting Tips',
      '1. Make sure Bluetooth is enabled\n2. Check if device is powered on\n3. Keep device within 10 meters\n4. Restart the device if needed',
      [{text: 'OK'}]
    );
  };

  return (
    <Layout title="Connect Device">
      <View style={styles.container}>
        {/* Device Card */}
        <Card style={styles.deviceCard}>
          <View style={styles.deviceHeader}>
            <View style={styles.bluetoothIcon}>
              <Text style={styles.bluetoothText}>📡</Text>
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>MethoneSense-ESP32</Text>
              <Text style={styles.signalStrength}>Signal: -67 dBm</Text>
            </View>
            <Chip status={isConnected ? 'connected' : 'disconnected'} />
          </View>

          {isConnected && (
            <View style={styles.successMessage}>
              <Text style={styles.successText}>
                ✓ Device connected and ready to monitor
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            {!isConnected ? (
              <Button
                onPress={handleConnect}
                loading={isConnecting}
                fullWidth
                variant="primary">
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            ) : (
              <Button
                onPress={handleDisconnect}
                fullWidth
                variant="secondary">
                Disconnect
              </Button>
            )}
          </View>
        </Card>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Button
            onPress={handleTroubleshoot}
            variant="secondary"
            fullWidth>
            Trouble connecting?
          </Button>
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  deviceCard: {
    marginBottom: 16,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bluetoothIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.brandPrimary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bluetoothText: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink100,
    marginBottom: 4,
  },
  signalStrength: {
    fontSize: 14,
    color: colors.ink60,
  },
  successMessage: {
    backgroundColor: `${colors.semanticOk}15`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    color: colors.semanticOk,
    fontWeight: '600',
  },
  actions: {
    marginTop: 8,
  },
  helpSection: {
    marginTop: 24,
  },
});