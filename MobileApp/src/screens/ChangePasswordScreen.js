import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from '../components/SectionHeader';
import { ProfileService } from '../services/profile.service';

function PasswordInput({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder={label}
          placeholderTextColor="#94A3B8"
          style={styles.input}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShow((s) => !s)}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [newPw, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!current) return 'Enter your current password.';
    if (newPw.length < 6) return 'New password must be at least 6 characters.';
    if (newPw !== confirm) return 'Passwords do not match.';
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { Alert.alert('Validation Error', err); return; }

    setLoading(true);
    setSuccess(false);
    try {
      await ProfileService.changePassword(current, newPw);
      setSuccess(true);
      setCurrent('');
      setNew('');
      setConfirm('');
    } catch (e) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'Could not change password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <SectionHeader title="Change Password" />

      <View style={styles.card}>
        <PasswordInput label="Current Password" value={current} onChange={setCurrent} />
        <PasswordInput label="New Password" value={newPw} onChange={setNew} />
        <PasswordInput label="Confirm New Password" value={confirm} onChange={setConfirm} />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
              <Text style={styles.submitText}>Update Password</Text>
            </>
          )}
        </TouchableOpacity>

        {success && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#16A34A" />
            <Text style={styles.successText}>Password changed successfully!</Text>
          </View>
        )}
      </View>

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>Password Tips</Text>
        <Text style={styles.tipText}>
          Use at least 8 characters with a mix of letters, numbers, and symbols.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollRoot: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, paddingBottom: 60 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  inputGroup: { marginBottom: 18 },
  label: { color: '#475569', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: { flex: 1, color: '#0F172A', fontSize: 15 },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
  },
  successText: { color: '#065F46', fontWeight: '600', fontSize: 14 },
  tipBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
  },
  tipTitle: { color: '#1D4ED8', fontWeight: '700', marginBottom: 6 },
  tipText: { color: '#475569', lineHeight: 20 },
});
