import React from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {Layout} from '../../components/common/Layout';
import {Card} from '../../components/common/Card';
import {colors} from '../../utils/colors';

interface SeizureEvent {
  id: number;
  date: string;
  duration: string;
  severity: string;
  delta: string;
}

const sampleData: SeizureEvent[] = [
  {
    id: 1,
    date: '2025-01-15 14:30',
    duration: '45s',
    severity: 'Moderate',
    delta: '+18%',
  },
  {
    id: 2,
    date: '2025-01-10 09:15',
    duration: '30s',
    severity: 'Mild',
    delta: '+12%',
  },
];

export const HistoryScreen: React.FC = () => {
  const renderEventCard = ({item}: {item: SeizureEvent}) => {
    const severityColor =
      item.severity === 'Moderate'
        ? colors.semanticWarning
        : colors.semanticOk;

    return (
      <Card style={styles.eventCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{item.date}</Text>
          <View style={[styles.severityBadge, {backgroundColor: severityColor}]}>
            <Text style={styles.severityText}>{item.severity}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{item.duration}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delta:</Text>
            <Text style={styles.detailValue}>{item.delta}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <Layout title="History" scrollable={false}>
      <FlatList
        data={sampleData}
        renderItem={renderEventCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
  },
  eventCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink100,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.surface,
  },
  cardContent: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.ink60,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink100,
  },
});
