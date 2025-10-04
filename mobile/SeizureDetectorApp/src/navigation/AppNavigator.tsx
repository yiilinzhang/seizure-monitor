import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Text} from 'react-native';
import {colors} from '../utils/colors';

// Screens
import {ConnectDeviceScreen} from '../screens/connect/ConnectDeviceScreen';
import {LiveMonitorScreen} from '../screens/monitoring/LiveMonitorScreen';
import {EmergencyScreen} from '../screens/emergency/EmergencyScreen';
import {HistoryScreen} from '../screens/history/HistoryScreen';
import {SettingsScreen} from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color}) => {
          let emoji: string = '';

          switch (route.name) {
            case 'Connect':
              emoji = '📱';
              break;
            case 'Monitor':
              emoji = '📊';
              break;
            case 'History':
              emoji = '📋';
              break;
            case 'Emergency':
              emoji = '🚨';
              break;
            case 'Settings':
              emoji = '⚙️';
              break;
          }

          return (
            <Text style={{fontSize: 24, opacity: focused ? 1 : 0.5}}>
              {emoji}
            </Text>
          );
        },
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.ink60,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.ink100,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}>
      <Tab.Screen
        name="Connect"
        component={ConnectDeviceScreen}
        options={{title: 'Connect'}}
      />
      <Tab.Screen
        name="Monitor"
        component={LiveMonitorScreen}
        options={{title: 'Live Monitor'}}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{title: 'History'}}
      />
      <Tab.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{title: 'Emergency'}}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{title: 'Settings'}}
      />
    </Tab.Navigator>
  );
};
