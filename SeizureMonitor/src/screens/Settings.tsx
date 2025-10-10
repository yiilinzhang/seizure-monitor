import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { apiService } from '../services/api';

export const Settings: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editingPassword, setEditingPassword] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await apiService.getUser();
      if (user) {
        setUserName(user.name || 'User');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUserName('User');
    }
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      await apiService.updateUserName(tempName);
      setUserName(tempName);
      setEditingName(false);
      Alert.alert('Success', 'Name updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update name');
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await apiService.updatePassword(currentPassword, newPassword);
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    }
  };

  const ListItem = ({
    icon,
    title,
    value,
    onPress,
  }: {
    icon: string;
    title: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(138, 138, 138, 0.1)',
      }}
      onPress={onPress}
      disabled={!onPress}
    >
      <Icon name={icon} size={20} color="#8A8A8A" />
      <Text
        style={{
          flex: 1,
          fontSize: 16,
          color: '#3D3D3D',
          marginLeft: 12,
        }}
      >
        {title}
      </Text>
      {value && (
        <Text
          style={{
            fontSize: 14,
            color: '#8A8A8A',
          }}
        >
          {value}
        </Text>
      )}
      {onPress && <Icon name="chevron-right" size={20} color="#8A8A8A" />}
    </TouchableOpacity>
  );

  return (
    <Layout title="Settings">
      <View style={{ marginTop: 16 }}>
        <Card>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#3D3D3D',
              marginBottom: 16,
            }}
          >
            User Account
          </Text>

          {/* Name Section */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: '#8A8A8A', marginBottom: 8 }}>
              Name
            </Text>
            {!editingName ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="user" size={20} color="#8A8A8A" />
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#3D3D3D',
                      marginLeft: 12,
                    }}
                  >
                    {userName}
                  </Text>
                </View>
                <Button
                  variant="secondary"
                  onPress={() => {
                    setTempName(userName);
                    setEditingName(true);
                  }}
                >
                  Edit
                </Button>
              </View>
            ) : (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(138, 138, 138, 0.2)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    marginBottom: 12,
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
                    placeholder="Enter your name"
                    placeholderTextColor="#8A8A8A"
                    value={tempName}
                    onChangeText={setTempName}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    variant="secondary"
                    onPress={() => setEditingName(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button onPress={handleSaveName} style={{ flex: 1 }}>
                    Save
                  </Button>
                </View>
              </View>
            )}
          </View>

          {/* Password Section */}
          <View>
            <Text style={{ fontSize: 14, color: '#8A8A8A', marginBottom: 8 }}>
              Password
            </Text>
            {!editingPassword ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="lock" size={20} color="#8A8A8A" />
                  <Text
                    style={{
                      fontSize: 16,
                      color: '#3D3D3D',
                      marginLeft: 12,
                    }}
                  >
                    ••••••••
                  </Text>
                </View>
                <Button
                  variant="secondary"
                  onPress={() => setEditingPassword(true)}
                >
                  Change
                </Button>
              </View>
            ) : (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(138, 138, 138, 0.2)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    marginBottom: 12,
                  }}
                >
                  <Icon name="lock" size={20} color="#8A8A8A" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#3D3D3D',
                    }}
                    placeholder="Current password"
                    placeholderTextColor="#8A8A8A"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                  />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(138, 138, 138, 0.2)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    marginBottom: 12,
                  }}
                >
                  <Icon name="lock" size={20} color="#8A8A8A" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#3D3D3D',
                    }}
                    placeholder="New password"
                    placeholderTextColor="#8A8A8A"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(138, 138, 138, 0.2)',
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    marginBottom: 12,
                  }}
                >
                  <Icon name="check" size={20} color="#8A8A8A" />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: '#3D3D3D',
                    }}
                    placeholder="Confirm new password"
                    placeholderTextColor="#8A8A8A"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      setEditingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button onPress={handleSavePassword} style={{ flex: 1 }}>
                    Update
                  </Button>
                </View>
              </View>
            )}
          </View>
        </Card>

        <Card style={{ marginTop: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#3D3D3D',
              marginBottom: 16,
            }}
          >
            About
          </Text>
          <ListItem icon="info" title="Version" value="1.0.2 (build 145)" />
          <ListItem icon="cpu" title="Firmware" value="v2.3.1" />
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 12,
                color: '#8A8A8A',
                textAlign: 'center',
              }}
            >
              © 2025 MethoneSense Inc. All rights reserved.
            </Text>
          </View>
        </Card>

        <Card style={{ marginTop: 24 }}>
          <Button
            variant="destructive"
            onPress={async () => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                      await apiService.logout();
                      // Navigation will be handled by the main App component
                    },
                  },
                ]
              );
            }}
            fullWidth
          >
            Logout
          </Button>
        </Card>
      </View>
    </Layout>
  );
};