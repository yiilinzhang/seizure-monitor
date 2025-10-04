import React, {useState} from 'react';
import {View, Text, StyleSheet, Alert} from 'react-native';
import {Layout} from '../../components/common/Layout';
import {Card} from '../../components/common/Card';
import {Button} from '../../components/common/Button';
import {Toggle} from '../../components/common/Toggle';
import {colors} from '../../utils/colors';

export const SettingsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [backgroundMonitoring, setBackgroundMonitoring] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            console.log('User logged out');
          },
        },
      ]
    );
  };

  return (
    <Layout title="Settings">
      <View style={styles.container}>
        {/* User Profile */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john.doe@example.com</Text>
        </Card>

        {/* App Settings */}
        <Card style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <Toggle
            label="Notifications"
            value={notifications}
            onValueChange={setNotifications}
            style={styles.toggle}
          />
          <Toggle
            label="Auto-sync"
            value={autoSync}
            onValueChange={setAutoSync}
            style={styles.toggle}
          />
          <Toggle
            label="Background monitoring"
            value={backgroundMonitoring}
            onValueChange={setBackgroundMonitoring}
            style={styles.toggle}
          />
        </Card>

        {/* Logout Button */}
        <Button
          onPress={handleLogout}
          variant="secondary"
          fullWidth
          style={styles.logoutButton}>
          Logout
        </Button>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    marginBottom: 24,
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink100,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.ink60,
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
  logoutButton: {
    marginBottom: 24,
  },
  versionText: {
    fontSize: 14,
    color: colors.ink60,
    textAlign: 'center',
  },
});
