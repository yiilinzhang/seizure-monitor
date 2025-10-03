import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Layout} from '../../components/common/Layout';
import {Card} from '../../components/common/Card';
import {Button} from '../../components/common/Button';
import {Chip} from '../../components/common/Chip';
import {colors} from '../../utils/colors';

export const LiveMonitorScreen: React.FC = () => {
  const [isConnected] = useState(true);

  const handleMarkEvent = () => {
    console.log('Manual event marked');
  };

  return (
    <Layout
      title="Live Monitor"
      rightElement={<Chip status={isConnected ? 'connected' : 'disconnected'} />}
    >
      <View style={styles.container}>
        {/* Delta Card */}
        <Card style={styles.deltaCard}>
          <Text style={styles.deltaLabel}>Delta from Baseline</Text>
          <Text style={styles.deltaValue}>+18%</Text>
          <Text style={styles.deltaStatus}>Alert Threshold</Text>
        </Card>

        {/* Baseline Readings */}
        <Card style={styles.readingsCard}>
          <Text style={styles.sectionTitle}>Baseline Readings</Text>

          <View style={styles.readingRow}>
            <Text style={styles.readingLabel}>Resistance</Text>
            <Text style={styles.readingValue}>120 kΩ</Text>
          </View>

          <View style={styles.readingRow}>
            <Text style={styles.readingLabel}>Temperature</Text>
            <Text style={styles.readingValue}>24°C</Text>
          </View>

          <View style={styles.readingRow}>
            <Text style={styles.readingLabel}>Humidity</Text>
            <Text style={styles.readingValue}>45%</Text>
          </View>
        </Card>

        {/* Manual Event Button */}
        <Button
          onPress={handleMarkEvent}
          variant="secondary"
          fullWidth>
          Mark Event (manual)
        </Button>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Charts and detailed analytics will be added in the next update
        </Text>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  deltaCard: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 24,
  },
  deltaLabel: {
    fontSize: 14,
    color: colors.ink60,
    marginBottom: 8,
  },
  deltaValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.semanticAlert,
    marginBottom: 8,
  },
  deltaStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.semanticAlert,
    backgroundColor: `${colors.semanticAlert}15`,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  readingsCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink100,
    marginBottom: 16,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readingLabel: {
    fontSize: 16,
    color: colors.ink60,
  },
  readingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink100,
  },
  infoText: {
    fontSize: 14,
    color: colors.ink60,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});