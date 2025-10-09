import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';

// Import screens (we'll create these next)
import { LiveMonitor } from '../screens/LiveMonitor';
import { History } from '../screens/History';
import { Emergency } from '../screens/Emergency';
import { Settings } from '../screens/Settings';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
          tabBarActiveTintColor: '#87AEEE',
          tabBarInactiveTintColor: '#8A8A8A',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tab.Screen
          name="Monitor"
          component={LiveMonitor}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={History}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="bar-chart-2" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Emergency"
          component={Emergency}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="alert-circle" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={Settings}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="settings" size={22} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};