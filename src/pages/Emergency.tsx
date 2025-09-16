import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Toggle } from '../components/Toggle';
import { Button } from '../components/Button';
import { UserIcon, PhoneIcon, PencilIcon, XIcon, TrashIcon, LockIcon, UnlockIcon } from 'lucide-react';
interface Contact {
  id: string;
  name: string;
  phone: string;
  photo: string;
}
export const Emergency: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([{
    id: '1',
    name: 'John Doe',
    phone: '(555) 123-4567',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg'
  }, {
    id: '2',
    name: 'Jane Smith',
    phone: '(555) 987-6543',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg'
  }]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [autoCall, setAutoCall] = useState(true);
  const [autoSMS, setAutoSMS] = useState(true);
  const [isSettingsLocked, setIsSettingsLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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
  const handleSaveContact = () => {
    if (editingContact) {
      if (contacts.some(c => c.id === editingContact.id)) {
        setContacts(contacts.map(c => c.id === editingContact.id ? editingContact : c));
      } else {
        setContacts([...contacts, editingContact]);
      }
      setEditingContact(null);
      setIsEditMode(false);
    }
  };
  const handleDeleteContact = (contactId: string) => {
    setContacts(contacts.filter(contact => contact.id !== contactId));
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
        {!isEditMode ?
      // Display contacts in card bubbles
      <div className="grid grid-cols-1 gap-4">
            {contacts.map(contact => <Card key={contact.id} className="flex items-center p-4">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-h3 font-semibold">{contact.name}</h3>
                  <p className="text-bodySmall text-ink-60">{contact.phone}</p>
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
                  Phone
                </label>
                <div className="flex items-center border border-ink-60/20 rounded-lg overflow-hidden">
                  <div className="p-2 bg-gray-50">
                    <PhoneIcon size={20} className="text-ink-60" />
                  </div>
                  <input type="tel" value={editingContact.phone} onChange={e => handleContactChange('phone', e.target.value)} placeholder="Phone number" className="flex-1 p-2 outline-none text-bodySmall" />
                </div>
              </div>
              <Button onClick={handleSaveContact} fullWidth>
                Save Contact
              </Button>
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
    </Layout>;
};