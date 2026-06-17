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
import { SensorsService } from '../services/sensors.service';

function FormInput({ label, icon, value, onChangeText, keyboardType, suffix, placeholder }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        {icon && <Ionicons name={icon} size={18} color="#64748B" style={{ marginRight: 8 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          placeholder={placeholder || label}
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const DOOR_OPTIONS = ['Closed', 'Open'];

export default function ManualReadingScreen({ route }) {
  const presetDeviceId = route?.params?.deviceId || '';
  const [deviceId, setDeviceId] = useState(presetDeviceId);
  const [temp, setTemp] = useState('');
  const [hum, setHum] = useState('');
  const [door, setDoor] = useState('Closed');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!deviceId.trim()) return 'Device ID is required.';
    const t = parseFloat(temp);
    const h = parseFloat(hum);
    if (isNaN(t)) return 'Enter a valid temperature.';
    if (isNaN(h) || h < 0 || h > 100) return 'Enter a valid humidity (0–100).';
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { Alert.alert('Validation Error', err); return; }

    setLoading(true);
    setSuccess(false);
    try {
      await SensorsService.submitManualReading({
        deviceId: deviceId.trim(),
        temperature: parseFloat(temp),
        humidity: parseFloat(hum),
        doorStatus: door,
      });
      setSuccess(true);
      setTemp('');
      setHum('');
    } catch (e) {
      Alert.alert(
        'Submission Failed',
        e?.response?.data?.message || 'Could not submit reading. Please try again.'
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
      <SectionHeader title="Manual Reading" />

      <View style={styles.card}>
        <FormInput
          label="Device ID"
          icon="hardware-chip-outline"
          value={deviceId}
          onChangeText={setDeviceId}
          placeholder="e.g. DEV-001"
        />
        <FormInput
          label="Temperature"
          icon="thermometer-outline"
          value={temp}
          onChangeText={setTemp}
          keyboardType="numeric"
          suffix="°C"
          placeholder="e.g. 2.4"
        />
        <FormInput
          label="Humidity"
          icon="water-outline"
          value={hum}
          onChangeText={setHum}
          keyboardType="numeric"
          suffix="%"
          placeholder="e.g. 88"
        />

        {/* Door toggle */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Door Status</Text>
          <View style={styles.doorRow}>
            {DOOR_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.doorBtn, door === opt && styles.doorBtnActive]}
                onPress={() => setDoor(opt)}
              >
                <Ionicons
                  name={opt === 'Open' ? 'lock-open-outline' : 'lock-closed-outline'}
                  size={16}
                  color={door === opt ? '#fff' : '#64748B'}
                />
                <Text style={[styles.doorTxt, door === opt && styles.doorTxtActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.submitText}>Submit Reading</Text>
            </>
          )}
        </TouchableOpacity>

        {success && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#16A34A" />
            <Text style={styles.successText}>Reading submitted successfully!</Text>
          </View>
        )}
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
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: { flex: 1, color: '#0F172A', fontSize: 15 },
  suffix: { color: '#64748B', fontWeight: '700', marginLeft: 8 },
  doorRow: { flexDirection: 'row', gap: 12 },
  doorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doorBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  doorTxt: { fontWeight: '600', color: '#64748B' },
  doorTxtActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
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
});
