import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isRegistering && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F5F2EE' }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '600',
              color: '#3D3D3D',
              marginBottom: 8,
            }}
          >
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#8A8A8A',
              marginBottom: 24,
            }}
          >
            {isRegistering
              ? 'Sign up to get started with seizure monitoring'
              : 'Sign in to continue to your account'}
          </Text>

          {isRegistering && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: '#8A8A8A',
                  marginBottom: 8,
                }}
              >
                Name
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(138, 138, 138, 0.2)',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 16,
                  color: '#3D3D3D',
                }}
                placeholder="Enter your name"
                placeholderTextColor="#8A8A8A"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                color: '#8A8A8A',
                marginBottom: 8,
              }}
            >
              Email
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: 'rgba(138, 138, 138, 0.2)',
                borderRadius: 12,
                padding: 12,
                fontSize: 16,
                color: '#3D3D3D',
              }}
              placeholder="Enter your email"
              placeholderTextColor="#8A8A8A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                color: '#8A8A8A',
                marginBottom: 8,
              }}
            >
              Password
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: 'rgba(138, 138, 138, 0.2)',
                borderRadius: 12,
                padding: 12,
                fontSize: 16,
                color: '#3D3D3D',
              }}
              placeholder="Enter your password"
              placeholderTextColor="#8A8A8A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Button
            onPress={handleSubmit}
            fullWidth
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isRegistering
              ? 'Sign Up'
              : 'Sign In'}
          </Button>

          <View
            style={{
              marginTop: 20,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: '#8A8A8A' }}>
              {isRegistering
                ? 'Already have an account? '
                : "Don't have an account? "}
            </Text>
            <Button
              variant="secondary"
              onPress={() => {
                setIsRegistering(!isRegistering);
                setEmail('');
                setPassword('');
                setName('');
              }}
              style={{ marginTop: 8 }}
            >
              {isRegistering ? 'Sign In' : 'Sign Up'}
            </Button>
          </View>
        </Card>

        <Text
          style={{
            fontSize: 12,
            color: '#8A8A8A',
            textAlign: 'center',
            marginTop: 20,
            fontStyle: 'italic',
          }}
        >
          This is not a medical device.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};