import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigation from './src/navigation';
import SplashScreen from './src/screens/SplashScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import {AuthService} from './src/services/auth.service';
import {AuthContext} from './src/context/AuthContext';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      const current = await AuthService.getCurrentUser();
      setUser(current);
      setLoading(false);
    };
    boot();
  }, []);

  if (loading) return <SplashScreen />;

  if (user) {
    return (
      <AuthContext.Provider value={{ user, setUser }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" />
            <AppNavigation user={user} />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthContext.Provider>
    );
  }

  if (!showLogin) {
    return <WelcomeScreen onGetStarted={() => setShowLogin(true)} />;
  }

  return <LoginScreen onLogin={setUser} />;
}
