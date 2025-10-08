import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export const HistoryScreen: React.FC = () => {
  const events = [
    { id: 1, date: '2025-10-06', severity: 'Low', duration: '30s' },
    { id: 2, date: '2025-10-05', severity: 'Medium', duration: '45s' },
    { id: 3, date: '2025-10-04', severity: 'High', duration: '1m 20s' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>October 2025</Text>
      </View>

      {events.map(event => (
        <TouchableOpacity key={event.id} style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventDate}>{event.date}</Text>
            <View
              style={[
                styles.severityBadge,
                event.severity === 'High' && styles.severityHigh,
                event.severity === 'Medium' && styles.severityMedium,
                event.severity === 'Low' && styles.severityLow,
              ]}>
              <Text style={styles.severityText}>{event.severity}</Text>
            </View>
          </View>
          <Text style={styles.eventDuration}>Duration: {event.duration}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2EE',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3D3D3D',
  },
  subtitle: {
    fontSize: 16,
    color: '#8A8A8A',
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D3D3D',
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityHigh: {
    backgroundColor: '#FF8383',
  },
  severityMedium: {
    backgroundColor: '#FFD8CC',
  },
  severityLow: {
    backgroundColor: '#83D49B',
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  eventDuration: {
    fontSize: 14,
    color: '#8A8A8A',
  },
});
