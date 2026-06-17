import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';

import AppNavigation from './src/navigation';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';

import { AuthContext } from './src/context/AuthContext';
import { AuthService } from './src/services/auth.service';
import { setLogoutCallback } from './src/services/axios.instance';
import { NotificationService } from './src/services/notification.service';
import { SocketService } from './src/services/socket.service';

async function checkForOTAUpdate() {
  if (__DEV__) return;
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Update Ready',
        'A new version has been downloaded and will apply now.',
        [{ text: 'OK', onPress: () => Updates.reloadAsync() }],
        { cancelable: false }
      );
    }
  } catch {
    // Not configured or no network — safe to ignore
  }
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const handleLogout = useCallback(() => {
    SocketService.disconnect();
    setUser(null);
    setShowLogin(false);
  }, []);

  useEffect(() => {
    // Wire up the forced-logout callback in the axios interceptor
    setLogoutCallback(handleLogout);

    const boot = async () => {
      // Check for OTA update (no-op in dev)
      await checkForOTAUpdate();

      // Restore session
      const current = await AuthService.getCurrentUser();
      setUser(current);
      setBooting(false);
    };

    boot();

    // Request notification permissions
    NotificationService.init().catch(() => {});
  }, [handleLogout]);

  useEffect(() => {
    if (user) {
      SocketService.connect();
    }
  }, [user]);

  if (booting) return <SplashScreen />;

  if (user) {
    return (
      <AuthContext.Provider value={{ user, setUser, logout: handleLogout }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
            <AppNavigation />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthContext.Provider>
    );
  }

  if (!showLogin) {
    return <WelcomeScreen onGetStarted={() => setShowLogin(true)} />;
  }

  return (
    <LoginScreen
      onLogin={(u) => {
        setUser(u);
        setShowLogin(false);
      }}
    />
  );
}
