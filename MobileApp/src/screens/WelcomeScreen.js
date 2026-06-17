import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Feature = ({ icon, title, desc }) => (
  <View style={styles.featureRow}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={22} color="#1E3A8A" />
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
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* ── Hero ── */}
      <View style={styles.hero}>
        {/* Icon logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>

        {/* Text logo */}
        <Image
          source={require('../assets/logo-text.png')}
          style={styles.logoText}
          resizeMode="contain"
        />

        <Text style={styles.tagline}>
          Real-time insight into your cold storage units — anywhere, anytime.
        </Text>
      </View>

      {/* ── Feature card ── */}
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
  root: { flex: 1, backgroundColor: '#1E3A8A' },

  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    gap: 16,
  },
  logoWrap: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  logoImg: { width: 88, height: 88 },
  logoText: {
    width: 220,
    height: 52,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 28,
    paddingBottom: 40,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  featureDesc: { fontSize: 13, color: '#64748B', marginTop: 3, lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#F1F5F9' },

  btn: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    marginTop: 28,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
