import React from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import TabNavigator            from './TabNavigator';
import DeviceDetailScreen      from '../screens/DeviceDetailScreen';
import SensorHistoryScreen     from '../screens/SensorHistoryScreen';
import DeviceStatsScreen       from '../screens/DeviceStatsScreen';
import AlertDetailScreen       from '../screens/AlertDetailScreen';
import ManualReadingScreen     from '../screens/ManualReadingScreen';
import ChangePasswordScreen    from '../screens/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import AppSettingsScreen       from '../screens/AppSettingsScreen';

const Stack = createNativeStackNavigator();

function HeaderLogo() {
  return (
    <View style={styles.headerLogoWrap}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.headerLogoImg}
        resizeMode="contain"
      />
    </View>
  );
}

export default function StackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: true,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: Platform.OS === 'ios' ? 'slide_from_right' : 'fade_from_bottom',
        animationDuration: 250,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#1E3A8A',
        },
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '700',
          color: '#FFFFFF',
        },
        headerTintColor: '#FFFFFF',
        headerLeft: () => (
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => navigation.navigate('Home', { screen: 'Profile' })}
            style={styles.profileBtn}
          >
            <HeaderLogo />
          </Pressable>
        ),
        contentStyle: { backgroundColor: '#F8FAFC' },
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
        options={{ title: 'App Settings' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  backBtn: { marginLeft: Platform.OS === 'ios' ? 0 : -4, padding: 4 },
  profileBtn: { padding: 4 },
  headerLogoWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoImg: { width: 26, height: 26 },
});
