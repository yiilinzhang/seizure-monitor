import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

export const EmergencyScreen: React.FC = () => {
  const handleCall911 = () => {
    Alert.alert('Emergency', 'Calling 911...');
  };

  const contacts = [
    { id: 1, name: 'John Doe', phone: '+1 (555) 123-4567' },
    { id: 2, name: 'Jane Smith', phone: '+1 (555) 987-6543' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency</Text>
      </View>

      <TouchableOpacity style={styles.emergencyButton} onPress={handleCall911}>
        <Text style={styles.emergencyButtonText}>🚨 Call 911</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        {contacts.map(contact => (
          <TouchableOpacity key={contact.id} style={styles.contactCard}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactPhone}>{contact.phone}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  emergencyButton: {
    backgroundColor: '#FF8383',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3D3D3D',
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D3D3D',
  },
  contactPhone: {
    fontSize: 14,
    color: '#8A8A8A',
    marginTop: 4,
  },
});
