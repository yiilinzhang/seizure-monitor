import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {Layout} from '../../components/common/Layout';
import {Card} from '../../components/common/Card';
import {Button} from '../../components/common/Button';
import {Chip} from '../../components/common/Chip';
import {colors, fontSize, spacing} from '../../utils/colors';

export const ConnectDeviceScreen: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      // Navigate to Live Monitor after connection
      setTimeout(() => {
        // TODO: navigation.navigate('LiveMonitor');
      }, 1000);
    }, 2000);
  };

  return (
    <Layout title="Connect Sensor">
      <View style={styles.container}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceInfo}>
                <View style={styles.bluetoothIcon}>
                  <Text style={styles.bluetoothIconText}>BT</Text>
                </View>
                <Text style={styles.deviceName}>MethoneSense-ESP32</Text>
              </View>
              <Chip status={isConnected ? 'connected' : 'disconnected'} />
            </View>

            <View style={styles.signalContainer}>
              <Text style={styles.signalLabel}>Signal strength</Text>
              <Text style={styles.signalValue}>-67 dBm</Text>
            </View>

            <Button
              onPress={handleConnect}
              disabled={isConnecting || isConnected}
              loading={isConnecting}
              fullWidth>
              {isConnected ? 'Connected' : 'Connect'}
            </Button>
          </Card>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Text style={styles.troubleText}>Trouble connecting?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Help Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoIconText}>i</Text>
              </View>
              <View style={styles.modalTextContainer}>
                <Text style={styles.modalTitle}>Connection Help</Text>
                <View style={styles.helpList}>
                  <Text style={styles.helpItem}>
                    1. Make sure your sensor is powered on
                  </Text>
                  <Text style={styles.helpItem}>
                    2. Ensure Bluetooth is enabled on your device
                  </Text>
                  <Text style={styles.helpItem}>
                    3. Keep the sensor within 10 meters of your phone
                  </Text>
                  <Text style={styles.helpItem}>
                    4. If still not connecting, try restarting the sensor
                  </Text>
                </View>
              </View>
            </View>
            <Button
              variant="secondary"
              onPress={() => setShowModal(false)}
              fullWidth>
              Close
            </Button>
          </View>
        </View>
      </Modal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  card: {
    marginTop: spacing.margin,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.margin,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bluetoothIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.grid,
  },
  bluetoothIconText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  deviceName: {
    fontSize: fontSize.h2,
    fontWeight: '600',
    color: colors.ink[100],
  },
  signalContainer: {
    marginBottom: spacing.margin,
  },
  signalLabel: {
    fontSize: fontSize.bodySmall,
    color: colors.ink[60],
    marginBottom: 4,
  },
  signalValue: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink[100],
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.margin * 2,
  },
  troubleText: {
    fontSize: fontSize.bodySmall,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.margin,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.margin + 4,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    marginBottom: spacing.margin,
  },
  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.grid,
    marginTop: 2,
  },
  infoIconText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: fontSize.h2,
    fontWeight: '600',
    color: colors.ink[100],
    marginBottom: spacing.grid,
  },
  helpList: {
    gap: spacing.grid,
  },
  helpItem: {
    fontSize: fontSize.bodySmall,
    color: colors.ink[100],
    lineHeight: 20,
  },
});
