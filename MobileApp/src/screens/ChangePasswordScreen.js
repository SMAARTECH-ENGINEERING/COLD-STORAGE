import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import {ProfileService} from '../services/profile.service';

export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [newPw, setNew] = useState('');
  const [msg, setMsg] = useState(null);

  const submit = async () => {
    const r = await ProfileService.changePassword(current, newPw);
    setMsg(r.success ? 'Password changed successfully' : 'Unable to update password');
  };

  return (
    <ScreenContainer scroll>
      <SectionHeader title="Change Password" />

      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            value={newPw}
            onChangeText={setNew}
            secureTextEntry
            placeholder="Enter new password"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={submit}>
          <Text style={styles.submitText}>Update Password</Text>
        </TouchableOpacity>

        {msg ? <Text style={styles.message}>{msg}</Text> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    marginHorizontal: 0,
    marginTop: 0,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    color: '#475569',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    color: '#0F172A',
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
    color: '#16A34A',
    fontWeight: '600',
  },
});
