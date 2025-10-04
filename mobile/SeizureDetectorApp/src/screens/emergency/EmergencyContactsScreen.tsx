import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import {Layout} from '../../components/common/Layout';
import {Card} from '../../components/common/Card';
import {Button} from '../../components/common/Button';
import {Toggle} from '../../components/common/Toggle';
import {colors, fontSize, spacing} from '../../utils/colors';

interface Contact {
  id: number;
  name: string;
  phone: string;
  countryCode: string;
  avatar: string;
}

export const EmergencyContactsScreen: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [callOnSeizure, setCallOnSeizure] = useState(true);
  const [smsOnSeizure, setSmsOnSeizure] = useState(true);
  const [isSettingsLocked, setIsSettingsLocked] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Placeholder data
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      name: 'John Doe',
      phone: '91234567',
      countryCode: '+65',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=87AEEE',
    },
    {
      id: 2,
      name: 'Jane Smith',
      phone: '98765432',
      countryCode: '+65',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=FB83FF',
    },
  ]);

  const handleAddContact = () => {
    // TODO: Implement add contact functionality
    console.log('Add contact');
  };

  const handleDeleteContact = (id: number) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const rightElement = (
    <TouchableOpacity onPress={toggleEditMode}>
      <Text style={styles.editButton}>{isEditMode ? 'Done' : 'Edit'}</Text>
    </TouchableOpacity>
  );

  return (
    <Layout title="Emergency Contacts" rightElement={rightElement}>
      <View style={styles.container}>
        {/* Settings Section */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Emergency Settings</Text>
          <Toggle
            label="Call on seizure"
            value={callOnSeizure}
            onValueChange={setCallOnSeizure}
            style={styles.toggle}
          />
          <Toggle
            label="SMS on seizure"
            value={smsOnSeizure}
            onValueChange={setSmsOnSeizure}
            style={styles.toggle}
          />
        </Card>

        {/* Contacts List */}
        <Text style={styles.contactsHeader}>Contacts ({contacts.length})</Text>

        {contacts.map(contact => (
          <Card key={contact.id} style={styles.contactCard}>
            <View style={styles.contactContent}>
              <Image source={{uri: contact.avatar}} style={styles.avatar} />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              {isEditMode && (
                <TouchableOpacity
                  onPress={() => handleDeleteContact(contact.id)}
                  style={styles.deleteButton}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))}

        {/* Add Contact Button */}
        <Button
          onPress={handleAddContact}
          variant="secondary"
          fullWidth
          style={styles.addButton}>
          Add Contact
        </Button>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brandPrimary,
  },
  settingsCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink100,
    marginBottom: 16,
  },
  toggle: {
    marginBottom: 12,
  },
  contactsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink100,
    marginBottom: 12,
  },
  contactCard: {
    marginBottom: 12,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.bg,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink100,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: colors.ink60,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.semanticAlert,
  },
  addButton: {
    marginTop: 16,
  },
});
