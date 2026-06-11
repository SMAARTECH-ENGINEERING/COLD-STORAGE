import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';

export default function SplashScreen() {
  return (
    <ScreenContainer style={styles.root}>
      <View style={styles.center}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>❄️</Text>
        </View>
        <Text style={styles.title}>Cold Storage Monitor</Text>
        <Text style={styles.subtitle}>Real-time device insight for safe storage.</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2563EB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  logoText: {
    fontSize: 42,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
});
