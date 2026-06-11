import React, {useState} from 'react';
import {View, Switch, Text, StyleSheet} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';

export default function NotificationSettingsScreen() {
  const [temp, setTemp] = useState(true);
  const [hum, setHum] = useState(true);
  const [door, setDoor] = useState(true);
  const [offline, setOffline] = useState(true);

  return (
    <ScreenContainer scroll>
      <SectionHeader title="Notification Settings" />

      <View style={styles.card}>
        <NotificationRow label="Temperature Alerts" value={temp} onValueChange={setTemp} />
        <NotificationRow label="Humidity Alerts" value={hum} onValueChange={setHum} />
        <NotificationRow label="Door Alerts" value={door} onValueChange={setDoor} />
        <NotificationRow label="Offline Alerts" value={offline} onValueChange={setOffline} />
      </View>
    </ScreenContainer>
  );
}

function NotificationRow({label, value, onValueChange}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} thumbColor={value ? '#2563EB' : '#f4f3f4'} trackColor={{false: '#D1D5DB', true: '#93C5FD'}} />
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
});
