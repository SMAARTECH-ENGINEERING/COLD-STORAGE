import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';

export default function AppSettingsScreen() {
  const [theme, setTheme] = useState('System');
  const [unit, setUnit] = useState('Celsius');
  const [refresh, setRefresh] = useState('30s');

  return (
    <ScreenContainer scroll>
      <SectionHeader title="App Settings" />

      <View style={styles.card}>
        <SettingRow label="Theme" value={theme} />
        <SettingRow label="Temperature Unit" value={unit} />
        <SettingRow label="Refresh Interval" value={refresh} />
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.noteTitle}>Tip</Text>
        <Text style={styles.noteText}>
          Use the app settings to keep your readings up to date and aligned with your temperature units.
        </Text>
      </View>
    </ScreenContainer>
  );
}

function SettingRow({label, value}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: {
    color: '#475569',
    fontSize: 15,
  },
  value: {
    color: '#0f172a',
    fontWeight: '700',
  },
  noteBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 18,
  },
  noteTitle: {
    color: '#1D4ED8',
    fontWeight: '700',
    marginBottom: 8,
  },
  noteText: {
    color: '#475569',
    lineHeight: 20,
  },
});
