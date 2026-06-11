import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Feature = ({ icon, title, desc }) => (
  <View style={styles.featureRow}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={22} color="#2563EB" />
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  </View>
);

export default function WelcomeScreen({ onGetStarted }) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />

      {/* Top hero section */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>❄️</Text>
        </View>
        <Text style={styles.appName}>Cold Storage</Text>
        <Text style={styles.appName2}>Monitor</Text>
        <Text style={styles.tagline}>
          Real-time insight into your cold storage devices — anywhere, anytime.
        </Text>
      </View>

      {/* Features card */}
      <View style={styles.card}>
        <Feature
          icon="thermometer-outline"
          title="Live Temperature Tracking"
          desc="Monitor temperature & humidity in real time."
        />
        <View style={styles.divider} />
        <Feature
          icon="notifications-outline"
          title="Instant Alerts"
          desc="Get notified the moment something goes wrong."
        />
        <View style={styles.divider} />
        <Feature
          icon="hardware-chip-outline"
          title="Multi-Device Support"
          desc="Manage all your cold storage units in one place."
        />

        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.88}
          onPress={onGetStarted}
        >
          <Text style={styles.btnText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2563EB',
  },

  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },

  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  logoEmoji: {
    fontSize: 48,
  },

  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  appName2: {
    fontSize: 36,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    marginBottom: 16,
  },

  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 28,
    paddingBottom: 40,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  featureDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  btn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    marginTop: 28,
  },

  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
