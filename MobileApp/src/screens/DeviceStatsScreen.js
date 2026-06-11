import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';

export default function DeviceStatsScreen({route}) {
  const {deviceId} = route.params || {};

  return (
    <ScreenContainer scroll>
      <SectionHeader title="Device Stats" />

      <View style={styles.card}>
        <Text style={styles.title}>Stats for {deviceId}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Average Temperature</Text>
          <Text style={styles.value}>2.3°</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Min Temperature</Text>
          <Text style={styles.value}>-1.5°</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Max Temperature</Text>
          <Text style={styles.value}>6.1°</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Average Humidity</Text>
          <Text style={styles.value}>88%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Readings</Text>
          <Text style={styles.value}>1234</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Door Open Count</Text>
          <Text style={styles.value}>12</Text>
        </View>
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
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    color: '#64748B',
    fontSize: 14,
  },
  value: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
});
