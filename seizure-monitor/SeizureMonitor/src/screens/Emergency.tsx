import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Toggle } from '../components/Toggle';
import { apiService } from '../services/api';
import { locationService } from '../services/location';

interface Contact {
  id: string | number;
  name: string;
  phone: string;
  countryCode: string;
  photo: string;
}

export const Emergency: React.FC = () => {
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
            contact.name
          )}&background=random`,
        };
      });
      setContacts(formattedContacts);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmergency = async () => {
    Alert.alert(
      'Test Emergency',
      'This will send real SMS and voice calls to all emergency contacts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            setIsTriggeringEmergency(true);
            try {
              let location = { lat: 1.3521, lng: 103.8198 };
              try {
                const currentLocation = await locationService.getCurrentLocation();
                location = currentLocation;
              } catch (locError) {
                console.log('Location unavailable:', locError);
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
              Alert.alert('Success', 'Emergency triggered successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setIsTriggeringEmergency(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;

    if (!editingContact.name || !editingContact.phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const fullPhoneNumber = editingContact.countryCode + editingContact.phone;

      if (typeof editingContact.id === 'number' && editingContact.id > 0) {
        await apiService.updateContact(
          editingContact.id,
          editingContact.name,
          fullPhoneNumber
        );
      } else {
        await apiService.addContact(editingContact.name, fullPhoneNumber);
      }

      await fetchContacts();
      setEditingContact(null);
      setIsEditMode(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteContact = async (contactId: string | number) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (typeof contactId === 'number') {
                await apiService.deleteContact(contactId);
                await fetchContacts();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleAddNew = () => {
    setEditingContact({
      id: Date.now().toString(),
      name: '',
      phone: '',
      countryCode: '+65',
      photo: 'https://ui-avatars.com/api/?name=New&background=random',
    });
    setIsEditMode(true);
  };

  const handleUnlockSettings = () => {
    if (passwordInput === '1234') {
      setIsSettingsLocked(false);
      setShowPasswordModal(false);
      setPasswordInput('');
    } else {
      Alert.alert('Error', 'Incorrect password');
    }
  };

  return (
    <Layout
      title="Emergency"
      rightElement={
        !isEditMode ? (
          <TouchableOpacity onPress={() => setIsEditMode(true)}>
            <Icon name="edit-2" size={20} color="#8A8A8A" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setIsEditMode(false);
              setEditingContact(null);
            }}
          >
            <Icon name="x" size={20} color="#8A8A8A" />
          </TouchableOpacity>
        )
      }
    >
      <View style={{ marginTop: 16 }}>
        {loading ? (
          <Card>
            <Text style={{ textAlign: 'center', color: '#8A8A8A' }}>
              Loading contacts...
            </Text>
          </Card>
        ) : !isEditMode ? (
          <>
            {contacts.map(contact => (
              <Card key={contact.id} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={{ uri: contact.photo }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      marginRight: 16,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#3D3D3D',
                      }}
                    >
                      {contact.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#8A8A8A', marginTop: 4 }}>
                      {contact.countryCode} {contact.phone}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingContact(contact);
                        setIsEditMode(true);
                      }}
                      style={{ padding: 8 }}
                    >
                      <Icon name="edit-2" size={18} color="#8A8A8A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteContact(contact.id)}
                      style={{ padding: 8 }}
                    >
                      <Icon name="trash-2" size={18} color="#FF8383" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
            <Button onPress={handleAddNew} fullWidth>
              Add Emergency Contact
            </Button>
          </>
        ) : editingContact ? (
          <Card>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#3D3D3D',
                marginBottom: 16,
              }}
            >
              {editingContact.id ? 'Edit' : 'Add'} Contact
            </Text>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Image
                source={{ uri: editingContact.photo }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                }}
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: '#8A8A8A', marginBottom: 8 }}>
                Name
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(138, 138, 138, 0.2)',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                }}
              >
                <Icon name="user" size={20} color="#8A8A8A" />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    fontSize: 16,
                    color: '#3D3D3D',
                  }}
                  placeholder="Contact name"
                  placeholderTextColor="#8A8A8A"
                  value={editingContact.name}
                  onChangeText={text =>
                    setEditingContact({ ...editingContact, name: text })
                  }
                />
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: '#8A8A8A', marginBottom: 8 }}>
                Phone Number
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(138, 138, 138, 0.2)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#3D3D3D' }}>
                    {editingContact.countryCode}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(138, 138, 138, 0.2)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                  }}
                >
                  <Icon name="phone" size={20} color="#8A8A8A" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#3D3D3D',
                    }}
                    placeholder="Phone number"
                    placeholderTextColor="#8A8A8A"
                    value={editingContact.phone}
                    onChangeText={text =>
                      setEditingContact({
                        ...editingContact,
                        phone: text.replace(/[^\d]/g, ''),
                      })
                    }
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                variant="secondary"
                onPress={() => {
                  setEditingContact(null);
                  setIsEditMode(false);
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button onPress={handleSaveContact} style={{ flex: 1 }}>
                Save Contact
              </Button>
            </View>
          </Card>
        ) : null}

        <Card style={{ marginTop: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#3D3D3D',
              }}
            >
              Emergency Settings
            </Text>
            <TouchableOpacity
              onPress={() =>
                isSettingsLocked
                  ? setShowPasswordModal(true)
                  : setIsSettingsLocked(true)
              }
            >
              <Icon
                name={isSettingsLocked ? 'lock' : 'unlock'}
                size={18}
                color="#8A8A8A"
              />
            </TouchableOpacity>
          </View>
          <View style={{ marginBottom: 16 }}>
            <Toggle
              label="Call on seizure"
              checked={autoCall}
              onChange={value =>
                isSettingsLocked ? setShowPasswordModal(true) : setAutoCall(value)
              }
            />
          </View>
          <View>
            <Toggle
              label="SMS on seizure"
              checked={autoSMS}
              onChange={value =>
                isSettingsLocked ? setShowPasswordModal(true) : setAutoSMS(value)
              }
            />
          </View>
        </Card>

        <Text
          style={{
            fontSize: 12,
            color: '#8A8A8A',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          This is not a medical device.
        </Text>
      </View>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Card style={{ width: '80%', maxWidth: 300 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#3D3D3D',
                marginBottom: 16,
              }}
            >
              Enter Password
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: 'rgba(138, 138, 138, 0.2)',
                borderRadius: 12,
                padding: 12,
                fontSize: 16,
                color: '#3D3D3D',
                marginBottom: 16,
              }}
              placeholder="Password"
              placeholderTextColor="#8A8A8A"
              value={passwordInput}
              onChangeText={setPasswordInput}
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                variant="secondary"
                onPress={() => setShowPasswordModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button onPress={handleUnlockSettings} style={{ flex: 1 }}>
                Unlock
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Test Emergency Button */}
      {contacts.length > 0 && (
        <TouchableOpacity
          onPress={handleTestEmergency}
          disabled={isTriggeringEmergency}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: isTriggeringEmergency ? '#8A8A8A' : '#FF8383',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text style={{ fontSize: 24, color: '#FFFFFF', fontWeight: 'bold' }}>
            !
          </Text>
        </TouchableOpacity>
      )}
    </Layout>
  );
};