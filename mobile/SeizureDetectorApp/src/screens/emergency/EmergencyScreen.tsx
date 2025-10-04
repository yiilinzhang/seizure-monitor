import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
// Icon replacement with text emojis for simplicity
import {apiService} from '../../services/api/apiClient';
import {locationService} from '../../services/location/locationService';

interface Contact {
  id: string | number;
  name: string;
  phone: string;
  countryCode: string;
  photo: string;
}

export const EmergencyScreen: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [autoCall, setAutoCall] = useState(true);
  const [autoSMS, setAutoSMS] = useState(true);
  const [isSettingsLocked, setIsSettingsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isTriggeringEmergency, setIsTriggeringEmergency] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    countryCode: '+65',
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const backendContacts = await apiService.getContacts();

      const formattedContacts = backendContacts.map((contact: any) => {
        let countryCode = '+65';
        let phone = contact.phone_number;

        const countryCodeMatch = contact.phone_number.match(/^(\+\d{1,4})/);
        if (countryCodeMatch) {
          countryCode = countryCodeMatch[1];
          phone = contact.phone_number.replace(countryCode, '');
        }

        return {
          id: contact.id,
          name: contact.name,
          phone: phone,
          countryCode: countryCode,
          photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            contact.name,
          )}&background=random`,
        };
      });

      setContacts(formattedContacts);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      Alert.alert('Error', 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmergency = () => {
    Alert.alert(
      'Test Emergency',
      'This will send real SMS and voice calls to all emergency contacts. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Continue', onPress: triggerEmergency},
      ],
    );
  };

  const triggerEmergency = async () => {
    setIsTriggeringEmergency(true);

    try {
      let location = {lat: 1.3521, lng: 103.8198};

      try {
        const currentLocation = await locationService.getCurrentLocation();
        location = {lat: currentLocation.lat, lng: currentLocation.lng};
      } catch (locError) {
        console.log('Location unavailable, using default:', locError);
      }

      const user = await apiService.getUser();
      const testData = {
        userId: user?.id || '5c350271cd4807fd591cfae2bb233f4a',
        eventId: `test_${Date.now()}`,
        location: location,
        delta_pct: 35.5,
        timestamp: Math.floor(Date.now() / 1000),
        sendSMS: autoSMS,
        sendCall: autoCall,
      };

      const response = await apiService.triggerEmergency(testData);

      Alert.alert(
        'Emergency Triggered',
        `Contacts notified: ${response.contactsNotified}\nLocation sent to contacts`,
        [{text: 'OK'}],
      );
    } catch (error) {
      console.error('Emergency trigger error:', error);
      Alert.alert('Error', 'Failed to trigger emergency');
    } finally {
      setIsTriggeringEmergency(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const fullPhone = `${newContact.countryCode}${newContact.phone}`;
      await apiService.addContact({
        name: newContact.name,
        phone_number: fullPhone,
      });

      setShowAddContactModal(false);
      setNewContact({name: '', phone: '', countryCode: '+65'});
      fetchContacts();
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  const handleDeleteContact = (contactId: string | number) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteContact(contactId);
              fetchContacts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Emergency Contacts</Text>
          <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
            <Text style={styles.editButton}>
              {isEditMode ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Emergency Settings</Text>
            <TouchableOpacity onPress={() => setShowPasswordModal(true)}>
              <Text style={styles.iconText}>
                {isSettingsLocked ? '🔒' : '🔓'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto Call</Text>
            <Switch
              value={autoCall}
              onValueChange={setAutoCall}
              disabled={isSettingsLocked}
              trackColor={{false: '#d1d5db', true: '#10b981'}}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto SMS</Text>
            <Switch
              value={autoSMS}
              onValueChange={setAutoSMS}
              disabled={isSettingsLocked}
              trackColor={{false: '#d1d5db', true: '#10b981'}}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Contacts List */}
        <View style={styles.contactsSection}>
          <View style={styles.contactsHeader}>
            <Text style={styles.sectionTitle}>
              Contacts ({contacts.length})
            </Text>
            <TouchableOpacity onPress={() => setShowAddContactModal(true)}>
              <Text style={styles.addIconText}>➕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#10b981"
              style={styles.loader}
            />
          ) : (
            contacts.map(contact => (
              <View key={contact.id} style={styles.contactCard}>
                <Image
                  source={{uri: contact.photo}}
                  style={styles.contactPhoto}
                />
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>
                    {contact.countryCode} {contact.phone}
                  </Text>
                </View>
                {isEditMode && (
                  <TouchableOpacity
                    onPress={() => handleDeleteContact(contact.id)}>
                    <Text style={styles.deleteIconText}>🗑️</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Test Emergency Button */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleTestEmergency}
          disabled={isTriggeringEmergency}>
          {isTriggeringEmergency ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.emergencyIcon}>⚠️</Text>
              <Text style={styles.emergencyButtonText}>
                Test Emergency Alert
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={showAddContactModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newContact.name}
              onChangeText={text => setNewContact({...newContact, name: text})}
            />

            <View style={styles.phoneInputContainer}>
              <TextInput
                style={[styles.input, styles.countryCodeInput]}
                value={newContact.countryCode}
                onChangeText={text =>
                  setNewContact({...newContact, countryCode: text})
                }
              />
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="Phone Number"
                value={newContact.phone}
                onChangeText={text =>
                  setNewContact({...newContact, phone: text})
                }
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddContactModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddContact}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  editButton: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  contactsSection: {
    padding: 20,
    paddingTop: 10,
  },
  contactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  contactPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    margin: 20,
    padding: 16,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loader: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeInput: {
    width: 80,
  },
  phoneInput: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  iconText: {
    fontSize: 20,
  },
  addIconText: {
    fontSize: 24,
  },
  deleteIconText: {
    fontSize: 20,
  },
  emergencyIcon: {
    fontSize: 20,
  },
});
