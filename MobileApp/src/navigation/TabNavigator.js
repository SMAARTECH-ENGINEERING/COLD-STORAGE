import React from 'react';
import {
  View,
  Text,
  Image,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen  from '../screens/DashboardScreen';
import DeviceListScreen from '../screens/DeviceListScreen';
import AlertsListScreen from '../screens/AlertListScreen';
import ProfileScreen    from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function CustomHeader({ title, navigation }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        {/* Icon logo in white pill */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>

        {/* Text logo + current screen name */}
        <View style={styles.brandTexts}>
          <Image
            source={require('../assets/logo-text.png')}
            style={styles.logoText}
            resizeMode="contain"
          />
          <Text style={styles.screenName}>{title}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => navigation.navigate('Profile')}
        style={styles.profileBtn}
        hitSlop={8}
      >
        <Ionicons name="person-circle-outline" size={34} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        header: () => (
          <CustomHeader title={route.name} navigation={navigation} />
        ),
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarItemStyle: { paddingVertical: 4, borderRadius: 14 },
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          height: Platform.OS === 'ios' ? 78 : 70,
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Dashboard: focused ? 'grid'          : 'grid-outline',
            Devices:   focused ? 'hardware-chip' : 'hardware-chip-outline',
            Alerts:    focused ? 'notifications' : 'notifications-outline',
            Profile:   focused ? 'person'        : 'person-outline',
          };
          return (
            <Ionicons
              name={icons[route.name] || 'ellipse-outline'}
              size={focused ? 26 : 22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Devices"   component={DeviceListScreen} />
      <Tab.Screen name="Alerts"    component={AlertsListScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === 'ios' ? 120 : 106,
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  logoImg: { width: 36, height: 36 },
  brandTexts: { justifyContent: 'center' },
  logoText: { width: 110, height: 26 },
  screenName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  profileBtn: { paddingBottom: 2 },
});
