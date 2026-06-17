import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthService } from '../services/auth.service';

const { height } = Dimensions.get('window');

export default function LoginScreen({ onLogin }) {
  const [email, setEmail]           = useState('');
  const [pw, setPw]                 = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState(null);

  const doLogin = async () => {
    if (!email.trim() || !pw) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await AuthService.login(email.trim(), pw);
      onLogin(user);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          'Login failed. Check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* ── Hero section ── */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* ── Form card ── */}
      <ScrollView
        style={styles.cardScroll}
        contentContainerStyle={styles.cardContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Brand logo on white */}
        <Image
          source={require('../assets/logo-text.png')}
          style={styles.logoText}
          resizeMode="contain"
        />

        <Text style={styles.welcomeTitle}>Welcome back</Text>
        <Text style={styles.welcomeSub}>Sign in to monitor your cold storage</Text>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color="#64748B" />
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
              placeholder="you@example.com"
              placeholderTextColor="#CBD5E1"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
            <TextInput
              value={pw}
              onChangeText={(v) => { setPw(v); setError(null); }}
              placeholder="••••••••"
              placeholderTextColor="#CBD5E1"
              secureTextEntry={!showPw}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPw((s) => !s)} hitSlop={8}>
              <Ionicons
                name={showPw ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.signInBtn, loading && { opacity: 0.75 }]}
          onPress={doLogin}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <>
                <Text style={styles.signInText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )
          }
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          © {new Date().getFullYear()} Smaa Frost — Cold Storage & Refrigeration Technology
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const HERO_HEIGHT = height * 0.35;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1E3A8A' },

  /* ─── Hero ─── */
  hero: {
    height: HERO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 14,
  },
  logoImg: { width: 96, height: 96 },

  /* ─── Card ─── */
  cardScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  cardContent: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  logoText: {
    width: '80%',
    height: 56,
    alignSelf: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
    lineHeight: 20,
  },

  /* ─── Error ─── */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  errorText: { color: '#B91C1C', fontSize: 13, flex: 1, lineHeight: 18 },

  /* ─── Fields ─── */
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    gap: 10,
  },
  input: { flex: 1, color: '#0F172A', fontSize: 15 },

  /* ─── Button ─── */
  signInBtn: {
    backgroundColor: '#1E3A8A',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  signInText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
});
