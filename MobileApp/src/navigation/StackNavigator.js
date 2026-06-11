import React from 'react';
import { Platform, Pressable } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import TabNavigator from './TabNavigator';
import DeviceDetailScreen from '../screens/DeviceDetailScreen';
import SensorHistoryScreen from '../screens/SensorHistoryScreen';
import DeviceStatsScreen from '../screens/DeviceStatsScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import ManualReadingScreen from '../screens/ManualReadingScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import AppSettingsScreen from '../screens/AppSettingsScreen';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: true,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation:
          Platform.OS === 'ios' ? 'slide_from_right' : 'fade_from_bottom',
        animationDuration: 250,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#2563EB',
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
          color: '#FFFFFF',
        },
        headerTitleContainerStyle: {
          paddingLeft: 16,
        },
        headerRightContainerStyle: {
          paddingRight: 16,
        },
        headerTintColor: '#FFFFFF',
        headerRight: () => (
          <Pressable
            onPress={() => navigation.navigate('Home', { screen: 'Profile' })}
            style={{ padding: 8 }}
          >
            <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
          </Pressable>
        ),
        contentStyle: {
          backgroundColor: '#F8FAFC',
        },
      })}
    >
      <Stack.Screen
        name="Home"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeviceDetail"
        component={DeviceDetailScreen}
        options={{ title: 'Device Details' }}
      />
      <Stack.Screen
        name="SensorHistory"
        component={SensorHistoryScreen}
        options={{ title: 'Sensor History' }}
      />
      <Stack.Screen
        name="DeviceStats"
        component={DeviceStatsScreen}
        options={{ title: 'Statistics' }}
      />
      <Stack.Screen
        name="AlertDetail"
        component={AlertDetailScreen}
        options={{ title: 'Alert Details' }}
      />
      <Stack.Screen
        name="ManualReading"
        component={ManualReadingScreen}
        options={{ title: 'Manual Reading' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="AppSettings"
        component={AppSettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}
