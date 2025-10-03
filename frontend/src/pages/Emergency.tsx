import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Toggle } from '../components/Toggle';
import { Button } from '../components/Button';
import { UserIcon, PhoneIcon, PencilIcon, XIcon, TrashIcon, LockIcon, UnlockIcon, AlertTriangleIcon, MapPinIcon } from 'lucide-react';
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

  // Fetch contacts from backend on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const backendContacts = await apiService.getContacts();
      // Transform backend contacts to frontend format
      const formattedContacts = backendContacts.map((contact: any) => {
        // Parse phone number to extract country code and number
        let countryCode = '+65';
        let phone = contact.phone_number;

        // Extract country code if present
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
          photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=random`
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
    if (!confirm('This will send real SMS and voice calls to all emergency contacts. Continue?')) {
      return;
    }

    setIsTriggeringEmergency(true);

    try {
      // Get real location
      let location = { lat: 1.3521, lng: 103.8198 }; // Default Singapore

      try {
        const currentLocation = await locationService.getCurrentLocation();
        location = { lat: currentLocation.lat, lng: currentLocation.lng };
        console.log('Using real location:', location);
      } catch (locError) {
        console.log('Location unavailable, using default:', locError);
      }

      // Generate test data that mimics ESP32 sensor trigger
      const user = apiService.getUser();
      const testData = {
        userId: user?.id || '5c350271cd4807fd591cfae2bb233f4a', // Use logged in user ID
        eventId: `test_${Date.now()}`,
        location: location,
        delta_pct: 35.5, // Simulated menthone spike percentage
        timestamp: Math.floor(Date.now() / 1000),
        sendSMS: autoSMS,  // Use toggle setting
        sendCall: autoCall  // Use toggle setting
      };

      const response = await apiService.triggerEmergency(testData);

      alert(`Emergency triggered successfully!\n\nContacts notified: ${response.contactsNotified}\nLocation: ${locationService.getMapsUrl(location)}\n\nCheck console for details.`);
      console.log('Emergency trigger response:', response);
    } catch (error: any) {
      alert(`Failed to trigger emergency: ${error.message}\n\nMake sure:\n1. Backend is running (npm run dev in backend folder)\n2. Twilio credentials are configured\n3. Emergency contacts exist in database`);
      console.error('Emergency trigger error:', error);
    } finally {
      setIsTriggeringEmergency(false);
    }
  };

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditMode(true);
  };
  const handleCancel = () => {
    setIsEditMode(false);
    setEditingContact(null);
  };
  const handleSave = () => {
    if (editingContact) {
      setContacts(contacts.map(c => c.id === editingContact.id ? editingContact : c));
    } else if (editingContact === null && isEditMode) {
      // Save general settings
    }
    setIsEditMode(false);
    setEditingContact(null);
  };
  const handleAddNew = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      countryCode: '+65',
      photo: 'https://randomuser.me/api/portraits/lego/1.jpg'
    };
    setEditingContact(newContact);
    setIsEditMode(true);
  };
  const handleContactChange = (field: keyof Contact, value: string) => {
    if (editingContact) {
      setEditingContact({
        ...editingContact,
        [field]: value
      });
    }
  };
  const handleSaveContact = async () => {
    if (editingContact) {
      // Validate phone number for Singapore
      if (editingContact.countryCode === '+65' && editingContact.phone.length !== 8) {
        alert('Singapore phone numbers must be exactly 8 digits');
        return;
      }

      // General validation for other countries
      if (editingContact.phone.length < 7 || editingContact.phone.length > 15) {
        alert('Please enter a valid phone number');
        return;
      }

      try {
        const fullPhoneNumber = editingContact.countryCode + editingContact.phone;

        if (typeof editingContact.id === 'number' && editingContact.id > 0) {
          // Update existing contact in backend
          await apiService.updateContact(
            editingContact.id,
            editingContact.name,
            fullPhoneNumber
          );
        } else {
          // Add new contact to backend
          await apiService.addContact(
            editingContact.name,
            fullPhoneNumber
          );
        }

        // Refresh contacts from backend
        await fetchContacts();
        setEditingContact(null);
        setIsEditMode(false);
      } catch (error: any) {
        alert(`Failed to save contact: ${error.message}`);
      }
    }
  };
  const handleDeleteContact = async (contactId: string | number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        if (typeof contactId === 'number') {
          await apiService.deleteContact(contactId);
          await fetchContacts();
        } else {
          // For local contacts not yet in backend
          setContacts(contacts.filter(contact => contact.id !== contactId));
        }
      } catch (error: any) {
        alert(`Failed to delete contact: ${error.message}`);
      }
    }
  };
  const handleUnlockSettings = () => {
    if (passwordInput === '1234') {
      setIsSettingsLocked(false);
      setShowPasswordModal(false);
      setPasswordInput('');
    } else {
      alert('Incorrect password');
    }
  };
  const handleLockSettings = () => {
    setIsSettingsLocked(true);
  };
  return <Layout title="Emergency" rightContent={!isEditMode ? <button onClick={() => setIsEditMode(true)} className="p-2">
            <PencilIcon size={20} className="text-ink-60" />
          </button> : <button onClick={handleCancel} className="p-2">
            <XIcon size={20} className="text-ink-60" />
          </button>}>
      <div className="space-y-6 mt-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-bodySmall text-ink-60">Loading contacts...</p>
          </div>
        ) : !isEditMode ?
      // Display contacts in card bubbles
      <div className="grid grid-cols-1 gap-4">
            {contacts.map(contact => <Card key={contact.id} className="flex items-center p-4">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-h3 font-semibold">{contact.name}</h3>
                  <p className="text-bodySmall text-ink-60">{contact.countryCode} {contact.phone}</p>
                </div>
                <div className="flex">
                  <button onClick={() => handleEditClick(contact)} className="p-2 text-ink-60">
                    <PencilIcon size={18} />
                  </button>
                  <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-red-500">
                    <TrashIcon size={18} />
                  </button>
                </div>
              </Card>)}
            <Button onClick={handleAddNew} fullWidth>
              Add Emergency Contact
            </Button>
          </div> : editingContact ?
      // Edit contact form
      <Card>
            <h2 className="text-h2 font-semibold mb-4">
              {editingContact.id ? 'Edit' : 'Add'} Contact
            </h2>
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img src={editingContact.photo} alt="Contact" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-bodySmall text-ink-60 mb-1">
                  Name
                </label>
                <div className="flex items-center border border-ink-60/20 rounded-lg overflow-hidden">
                  <div className="p-2 bg-gray-50">
                    <UserIcon size={20} className="text-ink-60" />
                  </div>
                  <input type="text" value={editingContact.name} onChange={e => handleContactChange('name', e.target.value)} placeholder="Contact name" className="flex-1 p-2 outline-none text-bodySmall" />
                </div>
              </div>
              <div>
                <label className="block text-bodySmall text-ink-60 mb-1">
                  Phone Number (Include country code for international)
                </label>
                <div className="flex space-x-2">
                  <div className="flex items-center border border-ink-60/20 rounded-lg overflow-hidden w-32">
                    <select
                      value={editingContact.countryCode}
                      onChange={e => handleContactChange('countryCode', e.target.value)}
                      className="w-full p-2 outline-none text-bodySmall bg-white"
                    >
                      <option value="+65">+65 (SG)</option>
                      <option value="+1">+1 (US/CA)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+61">+61 (AU)</option>
                      <option value="+60">+60 (MY)</option>
                      <option value="+62">+62 (ID)</option>
                      <option value="+63">+63 (PH)</option>
                      <option value="+66">+66 (TH)</option>
                      <option value="+84">+84 (VN)</option>
                      <option value="+91">+91 (IN)</option>
                      <option value="+86">+86 (CN)</option>
                      <option value="+852">+852 (HK)</option>
                      <option value="+81">+81 (JP)</option>
                      <option value="+82">+82 (KR)</option>
                      <option value="+49">+49 (DE)</option>
                      <option value="+33">+33 (FR)</option>
                      <option value="+39">+39 (IT)</option>
                      <option value="+34">+34 (ES)</option>
                      <option value="+31">+31 (NL)</option>
                      <option value="+41">+41 (CH)</option>
                    </select>
                  </div>
                  <div className="flex-1 flex items-center border border-ink-60/20 rounded-lg overflow-hidden">
                    <div className="p-2 bg-gray-50">
                      <PhoneIcon size={20} className="text-ink-60" />
                    </div>
                    <input
                      type="tel"
                      value={editingContact.phone}
                      onChange={e => handleContactChange('phone', e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="Phone number (digits only)"
                      className="flex-1 p-2 outline-none text-bodySmall"
                    />
                  </div>
                </div>
                <p className="text-xs text-ink-60 mt-1">
                  Singapore numbers must be 8 digits. Example: 91234567
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setEditingContact(null);
                    setIsEditMode(false);
                  }}
                  variant="secondary"
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveContact}
                  fullWidth
                  disabled={!editingContact.name || !editingContact.phone}
                >
                  Save Contact
                </Button>
              </div>
            </div>
          </Card> :
      // Settings edit mode
      <>
            <Card>
              <h2 className="text-h2 font-semibold mb-4">Alert Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-bodySmall">Auto-call on detection</span>
                  <Toggle checked={autoCall} onChange={setAutoCall} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-bodySmall">Auto-SMS on detection</span>
                  <Toggle checked={autoSMS} onChange={setAutoSMS} />
                </div>
              </div>
            </Card>
            <Button onClick={handleSave} fullWidth>
              Done
            </Button>
          </>}
        {/* Emergency Settings with Lock */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 font-semibold">Emergency Settings</h2>
            <button onClick={isSettingsLocked ? () => setShowPasswordModal(true) : handleLockSettings} className="p-2 text-ink-60">
              {isSettingsLocked ? <LockIcon size={18} /> : <UnlockIcon size={18} />}
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-bodySmall">Call on seizure</span>
              <Toggle checked={autoCall} onChange={value => isSettingsLocked ? setShowPasswordModal(true) : setAutoCall(value)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-bodySmall">SMS on seizure</span>
              <Toggle checked={autoSMS} onChange={value => isSettingsLocked ? setShowPasswordModal(true) : setAutoSMS(value)} />
            </div>
          </div>
        </Card>
        <div className="text-bodySmall text-ink-60 italic text-center">
          This is not a medical device.
        </div>
      </div>
      {/* Password Modal */}
      {showPasswordModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[80%] max-w-sm">
            <h3 className="text-h3 font-semibold mb-4">Enter Password</h3>
            <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full border border-ink-60/20 rounded-lg p-3 mb-4" placeholder="Password" />
            <div className="flex space-x-2">
              <Button onClick={() => setShowPasswordModal(false)} variant="secondary" fullWidth>
                Cancel
              </Button>
              <Button onClick={handleUnlockSettings} fullWidth>
                Unlock
              </Button>
            </div>
          </div>
        </div>}

      {/* Floating Test Emergency Button */}
      {contacts.length > 0 && (
        <button
          onClick={handleTestEmergency}
          disabled={isTriggeringEmergency}
          className="fixed bottom-24 right-4 w-12 h-12 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-colors"
          title="Test Emergency System"
        >
          {isTriggeringEmergency ? (
            <span className="text-xs">...</span>
          ) : (
            <span className="text-xl font-bold">!</span>
          )}
        </button>
      )}
    </Layout>;
};