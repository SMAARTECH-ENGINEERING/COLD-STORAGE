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
import {SensorsService} from '../services/sensors.service';

export default function ManualReadingScreen() {
  const [deviceId, setDeviceId] = useState('DEV-001');
  const [temp, setTemp] = useState('');
  const [hum, setHum] = useState('');
  const [door, setDoor] = useState('Closed');
  const [msg, setMsg] = useState(null);

  const submit = async () => {
    const payload = {
      deviceId,
      temperature: parseFloat(temp),
      humidity: parseFloat(hum),
      doorStatus: door,
      timestamp: Date.now(),
    };

    await SensorsService.submitManualReading(payload);
    setMsg('Manual reading submitted successfully');
  };

  return (
    <ScreenContainer scroll>
      <SectionHeader title="Manual Reading" />

      <View style={styles.card}>
        <FormInput label="Device ID" value={deviceId} onChangeText={setDeviceId} />
        <FormInput label="Temperature" value={temp} onChangeText={setTemp} keyboardType="numeric" suffix="°C" />
        <FormInput label="Humidity" value={hum} onChangeText={setHum} keyboardType="numeric" suffix="%" />
        <FormInput label="Door Status" value={door} onChangeText={setDoor} />

        <TouchableOpacity style={styles.submitBtn} onPress={submit}>
          <Text style={styles.submitText}>Submit Reading</Text>
        </TouchableOpacity>

        {msg ? <Text style={styles.confirmation}>{msg}</Text> : null}
      </View>
    </ScreenContainer>
  );
}

function FormInput({label, value, onChangeText, keyboardType, suffix}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={label}
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
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
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
  },
  suffix: {
    color: '#64748B',
    fontWeight: '700',
    marginLeft: 8,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  confirmation: {
    marginTop: 16,
    color: '#16A34A',
    fontWeight: '600',
    textAlign: 'center',
  },
});
