import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ListRow } from '../components/ListRow';
import { UserIcon, KeyIcon, InfoIcon, CheckIcon, XIcon } from 'lucide-react';
import { apiService } from '../services/api';
export const Settings: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editingPassword, setEditingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    // Load current user name
    try {
      const user = apiService.getUser();
      if (user) {
        setUserName(user.name || 'User');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUserName('User');
    }
  }, []);
  const handleSaveName = async () => {
    if (!tempName.trim()) {
      setNameError('Name cannot be empty');
      return;
    }

    try {
      // Update name via API
      const user = apiService.getUser();
      if (user) {
        await apiService.updateUserName(tempName);
        setUserName(tempName);
        setEditingName(false);
        setNameError('');
      }
    } catch (error: any) {
      console.error('Error updating name:', error);
      setNameError(error.message || 'Failed to update name');
    }
  };

  const handleSavePassword = async () => {
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      await apiService.updatePassword(currentPassword, newPassword);
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Password updated successfully');
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    }
  };

  return <Layout title="Settings">
      <div className="space-y-6 mt-4">
        <Card>
          <h2 className="text-h2 font-semibold mb-4">User Account</h2>

          {/* Name Section */}
          <div className="mb-6">
            <div className="text-bodySmall text-ink-60 mb-2">Name</div>
            {!editingName ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserIcon size={20} className="text-ink-60 mr-2" />
                  <span className="text-body">{userName}</span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTempName(userName);
                    setEditingName(true);
                    setNameError('');
                  }}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center border border-ink-60/20 rounded-lg overflow-hidden">
                  <div className="p-2 bg-gray-50">
                    <UserIcon size={20} className="text-ink-60" />
                  </div>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="flex-1 p-2 outline-none text-bodySmall"
                    placeholder="Enter your name"
                  />
                </div>
                {nameError && (
                  <p className="text-red-600 text-bodySmall">{nameError}</p>
                )}
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingName(false);
                      setNameError('');
                    }}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveName} fullWidth>
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div>
            <div className="text-bodySmall text-ink-60 mb-2">Password</div>
            {!editingPassword ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <KeyIcon size={20} className="text-ink-60 mr-2" />
                  <span className="text-body">••••••••</span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingPassword(true);
                    setPasswordError('');
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center border border-ink-60/20 rounded-lg overflow-hidden">
                  <div className="p-2 bg-gray-50">
                    <KeyIcon size={20} className="text-ink-60" />
                  </div>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="flex-1 p-2 outline-none text-bodySmall"
                    placeholder="Current password"
                  />
                </div>
                <div className="flex items-center border border-ink-60/20 rounded-lg overflow-hidden">
                  <div className="p-2 bg-gray-50">
                    <KeyIcon size={20} className="text-ink-60" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 p-2 outline-none text-bodySmall"
                    placeholder="New password"
                  />
                </div>
                <div className="flex items-center border border-ink-60/20 rounded-lg overflow-hidden">
                  <div className="p-2 bg-gray-50">
                    <CheckIcon size={20} className="text-ink-60" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 p-2 outline-none text-bodySmall"
                    placeholder="Confirm new password"
                  />
                </div>
                {passwordError && (
                  <p className="text-red-600 text-bodySmall">{passwordError}</p>
                )}
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError('');
                    }}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSavePassword} fullWidth>
                    Update
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="text-h2 font-semibold mb-4">About</h2>
          <div className="space-y-2">
            <ListRow icon={<InfoIcon size={20} className="text-ink-60" />} title="Version" meta="1.0.2 (build 145)" />
            <ListRow icon={<InfoIcon size={20} className="text-ink-60" />} title="Firmware" meta="v2.3.1" />
          </div>
          <div className="mt-4 text-bodySmall text-ink-60">
            © 2025 MethoneSense Inc. All rights reserved.
          </div>
        </Card>
      </div>
    </Layout>;
};