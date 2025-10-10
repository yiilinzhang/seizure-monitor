import React, { useState, useEffect } from 'react';
import { StatusBar, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Login } from './src/components/Login';
import { apiService } from './src/services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await apiService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F5F2EE',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#87AEEE" />
        <Text style={{ marginTop: 16, color: '#3D3D3D' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F2EE" />
      {isAuthenticated ? (
        <AppNavigator />
      ) : (
        <Login onSuccess={() => setIsAuthenticated(true)} />
      )}
    </SafeAreaProvider>
  );
}

export default App;
