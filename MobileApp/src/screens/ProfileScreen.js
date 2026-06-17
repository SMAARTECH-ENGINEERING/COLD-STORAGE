import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

import ScreenContainer from '../components/ScreenContainer';
import {ProfileService} from '../services/profile.service';
import {AuthService} from '../services/auth.service';
import {useAuth} from '../context/AuthContext';

export default function ProfileScreen({navigation}) {
  const {setUser} = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await ProfileService.getProfile();
      setProfile(data);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      {/* Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>

        <Text style={styles.name}>{profile?.name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile?.role}</Text>
        </View>
      </View>

      {/* User Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assigned Devices</Text>

        <View style={styles.infoCard}>
          <Ionicons style={styles.infoIcon} name="hardware-chip-outline" size={20} color="#1E3A8A" />

          <Text style={styles.infoText}>
            {profile?.assignedDevices?.length
              ? profile.assignedDevices.join(', ')
              : 'No devices assigned'}
          </Text>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <MenuItem
          icon="lock-closed-outline"
          title="Change Password"
          onPress={() => navigation.navigate('ChangePassword')}
        />

        <MenuItem
          icon="notifications-outline"
          title="Notification Settings"
          onPress={() => navigation.navigate('NotificationSettings')}
        />

        <MenuItem
          icon="settings-outline"
          title="App Settings"
          onPress={() => navigation.navigate('AppSettings')}
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

function MenuItem({icon, title, onPress}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color="#1E3A8A" />
        <Text style={styles.menuTitle}>{title}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#94A3B8"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },

  email: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },

  roleBadge: {
    marginTop: 12,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  roleText: {
    color: '#1D4ED8',
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  infoIcon: {
    marginRight: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
  },

  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },

  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuTitle: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  logoutBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 60,
  },

  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
});