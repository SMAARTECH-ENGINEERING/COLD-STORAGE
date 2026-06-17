import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';

const fmt = (val, suffix) =>
  val != null && val !== '--' ? `${val}${suffix}` : '--';

export default function DeviceCard({ device, onPress }) {
  const doorOpen = device.doorStatus?.toLowerCase() === 'open';
  const doorColor = doorOpen ? '#F59E0B' : '#10B981';
  const doorIcon = doorOpen ? 'lock-open-outline' : 'lock-closed-outline';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => onPress && onPress(device)}
    >
      <View style={styles.header}>
        <View style={styles.deviceInfo}>
          <View style={styles.iconWrap}>
            <Ionicons name="cube-outline" size={22} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {device.deviceId || device.id}
              {device.location ? ` • ${device.location}` : ''}
            </Text>
          </View>
        </View>
        <StatusBadge online={device.online} />
      </View>

      <View style={styles.divider} />

      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Ionicons name="thermometer-outline" size={18} color="#EF4444" />
          <Text style={styles.metricLabel}>Temp</Text>
          <Text style={[styles.metricValue, { color: '#EF4444' }]}>
            {fmt(device.temperature, '°')}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Ionicons name="water-outline" size={18} color="#3B82F6" />
          <Text style={styles.metricLabel}>Humidity</Text>
          <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
            {fmt(device.humidity, '%')}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Ionicons name={doorIcon} size={18} color={doorColor} />
          <Text style={styles.metricLabel}>Door</Text>
          <Text style={[styles.metricValue, { color: doorColor }]}>
            {device.doorStatus || '--'}
          </Text>
        </View>
      </View>

      {device.vegetable ? (
        <View style={styles.vegRow}>
          <Ionicons name="leaf-outline" size={13} color="#16A34A" />
          <Text style={styles.vegText}>{device.vegetable}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sub: { marginTop: 4, fontSize: 12, color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between' },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  metricLabel: { fontSize: 11, color: '#64748B', marginTop: 6 },
  metricValue: { marginTop: 4, fontSize: 15, fontWeight: '700' },
  vegRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  vegText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
});
