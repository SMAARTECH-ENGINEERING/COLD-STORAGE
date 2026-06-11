import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import {DevicesService} from '../services/devices.service';

export default function DeviceDetailScreen({route, navigation}) {
  const {deviceId} = route.params || {};
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await DevicesService.getById(deviceId);
        setDevice(d);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [deviceId]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <SectionHeader title="Device Details" />

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{device.name}</Text>
            <Text style={styles.subtitle}>{device.location || 'Unknown location'}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{device.status || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Temperature</Text>
            <Text style={styles.statValue}>{device.temperature}°</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Humidity</Text>
            <Text style={styles.statValue}>{device.humidity}%</Text>
          </View>
        </View>

        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Device ID</Text>
            <Text style={styles.infoValue}>{device.id}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Door Status</Text>
            <Text style={styles.infoValue}>{device.doorStatus}</Text>
          </View>
        </View>
      </View>

      <SectionHeader title="Actions" />
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('SensorHistory', {deviceId: device.id})}
        >
          <Ionicons name="bar-chart-outline" size={18} color="#2563EB" />
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AlertDetail', {alertId: null, deviceId: device.id})}
        >
          <Ionicons name="warning-outline" size={18} color="#2563EB" />
          <Text style={styles.actionText}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('DeviceStats', {deviceId: device.id})}
        >
          <Ionicons name="speedometer-outline" size={18} color="#2563EB" />
          <Text style={styles.actionText}>Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ManualReading', {deviceId: device.id})}
        >
          <Ionicons name="create-outline" size={18} color="#2563EB" />
          <Text style={styles.actionText}>Manual</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
  },
  statusBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  infoList: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  infoValue: {
    color: '#0f172a',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    marginHorizontal: 4,
  },
  actionText: {
    marginTop: 10,
    fontWeight: '700',
    color: '#2563EB',
    fontSize: 14,
  },
});
