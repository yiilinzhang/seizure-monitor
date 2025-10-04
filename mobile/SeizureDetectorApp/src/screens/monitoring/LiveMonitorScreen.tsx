import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {Layout} from '../../components/common/Layout';
import {Card} from '../../components/common/Card';
import {Button} from '../../components/common/Button';
import {Chip} from '../../components/common/Chip';
import {Toggle} from '../../components/common/Toggle';
import {colors, fontSize, spacing} from '../../utils/colors';

export const LiveMonitorScreen: React.FC = () => {
  const [isConnected] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showBaseline, setShowBaseline] = useState(true);
  const [threshold, setThreshold] = useState(15);
  const [duration, setDuration] = useState(5);
  const [showAlert, setShowAlert] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(10);

  const deltaPercent = '+18%';
  const isAlert = true;

  const handleMarkEvent = () => {
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

  const rightElement = (
    <TouchableOpacity
      onPress={() => setShowMenu(!showMenu)}
      style={styles.menuButton}>
      <Text style={styles.menuIcon}>⋮</Text>
    </TouchableOpacity>
  );

  return (
    <Layout title="Live Monitor" rightElement={rightElement}>
      <View style={styles.container}>
        {/* Connection Status */}
        <View style={styles.statusContainer}>
          <Chip status={isConnected ? 'connected' : 'disconnected'} />
        </View>

        {/* Delta Display */}
        <Card style={styles.deltaCard}>
          <Text
            style={[
              styles.deltaValue,
              {color: isAlert ? colors.semantic.alert : colors.semantic.ok},
            ]}>
            {deltaPercent}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📊</Text>
              <Text style={styles.metaText}>Baseline: 120 kΩ</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🌡️</Text>
              <Text style={styles.metaText}>24°C</Text>
              <Text style={styles.metaIcon}>💧</Text>
              <Text style={styles.metaText}>45%</Text>
            </View>
          </View>
        </Card>

        {/* Chart Placeholder */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Menthone (relative)</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.placeholderText}>Chart Placeholder</Text>
            <Text style={styles.placeholderSubtext}>
              Real-time visualization will appear here
            </Text>
          </View>
          <Toggle
            label="Show baseline"
            value={showBaseline}
            onValueChange={setShowBaseline}
            style={styles.toggle}
          />
        </Card>

        {/* Controls */}
        <Card style={styles.controlsCard}>
          <Text style={styles.sectionTitle}>Controls</Text>
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Threshold</Text>
            <View style={styles.controlValue}>
              <TouchableOpacity
                onPress={() => setThreshold(Math.max(0, threshold - 1))}>
                <Text style={styles.controlButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.controlText}>{threshold}%</Text>
              <TouchableOpacity
                onPress={() => setThreshold(Math.min(50, threshold + 1))}>
                <Text style={styles.controlButton}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.controlItem}>
            <Text style={styles.controlLabel}>Duration (seconds)</Text>
            <View style={styles.controlValue}>
              <TouchableOpacity
                onPress={() => setDuration(Math.max(1, duration - 1))}>
                <Text style={styles.controlButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.controlText}>{duration}s</Text>
              <TouchableOpacity
                onPress={() => setDuration(Math.min(30, duration + 1))}>
                <Text style={styles.controlButton}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Button onPress={handleMarkEvent} fullWidth>
            Mark Event (manual)
          </Button>
        </Card>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}>
          <View style={styles.menuContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}>
              <Text style={styles.menuItemText}>Re-baseline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}>
              <Text style={styles.menuItemText}>Set thresholds</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}>
              <Text style={styles.menuItemText}>Device info</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Alert Banner */}
      {showAlert && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            Detection ongoing... calling in {alertCountdown}s
          </Text>
          <Button
            variant="secondary"
            onPress={() => {
              setShowAlert(false);
              setAlertCountdown(10);
            }}
            fullWidth>
            Cancel
          </Button>
        </View>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusContainer: {
    marginTop: spacing.grid,
  },
  menuButton: {
    padding: spacing.grid,
  },
  menuIcon: {
    fontSize: 20,
    color: colors.ink[100],
    fontWeight: '600',
  },
  deltaCard: {
    marginTop: spacing.margin,
  },
  deltaValue: {
    fontSize: fontSize.title,
    fontWeight: '700',
    marginBottom: spacing.grid,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.grid,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: fontSize.mono,
    color: colors.ink[60],
    marginRight: spacing.grid,
  },
  chartCard: {
    marginTop: spacing.margin,
  },
  chartTitle: {
    fontSize: fontSize.h2,
    fontWeight: '600',
    color: colors.ink[100],
    marginBottom: spacing.grid,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: colors.bg,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.margin,
  },
  placeholderText: {
    fontSize: fontSize.body,
    color: colors.ink[60],
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: fontSize.bodySmall,
    color: colors.ink[60],
    marginTop: 4,
  },
  toggle: {
    marginTop: spacing.grid,
  },
  controlsCard: {
    marginTop: spacing.margin,
  },
  sectionTitle: {
    fontSize: fontSize.h2,
    fontWeight: '600',
    color: colors.ink[100],
    marginBottom: spacing.margin,
  },
  controlItem: {
    marginBottom: spacing.margin,
  },
  controlLabel: {
    fontSize: fontSize.bodySmall,
    color: colors.ink[60],
    marginBottom: spacing.grid,
  },
  controlValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.margin,
  },
  controlButton: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.brand.primary,
    paddingHorizontal: spacing.margin,
  },
  controlText: {
    fontSize: fontSize.h2,
    fontWeight: '600',
    color: colors.ink[100],
    minWidth: 60,
    textAlign: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: spacing.margin,
  },
  menuContent: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: spacing.grid + 4,
    paddingHorizontal: spacing.margin,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[60] + '20',
  },
  menuItemText: {
    fontSize: fontSize.bodySmall,
    color: colors.ink[100],
  },
  alertBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.semantic.alert,
    padding: spacing.margin,
  },
  alertText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.surface,
    marginBottom: spacing.grid,
  },
});
