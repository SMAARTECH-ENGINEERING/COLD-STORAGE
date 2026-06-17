import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from '../components/SectionHeader';
import { DevicesService } from '../services/devices.service';
import { SocketService } from '../services/socket.service';
import { getVocQuality } from '../utils/voc';

const STATUS_COLOR = { online: '#16A34A', offline: '#EF4444', maintenance: '#F59E0B' };

export default function DeviceDetailScreen({ route, navigation }) {
  const { deviceId, deviceStringId } = route.params || {};
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const d = await DevicesService.getById(deviceId);
      if (!d) throw new Error('Device not found');
      setDevice(d);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Could not load device.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!device?.id) return;
    let unsubReading, unsubStatus;
    let cancelled = false;

    SocketService.connect().then(() => {
      if (cancelled) return;
      SocketService.emit('join:device', device.id);

      unsubReading = SocketService.subscribe('sensor:reading', (payload) => {
        const r = payload?.reading ?? payload;
        if (!r) return;
        setDevice((d) => d ? {
          ...d,
          temperature: r.temperature ?? d.temperature,
          humidity: r.humidity ?? d.humidity,
          voc: r.voc ?? d.voc,
          doorStatus: r.doorStatus
            ? r.doorStatus.charAt(0).toUpperCase() + r.doorStatus.slice(1)
            : d.doorStatus,
        } : d);
      });

      unsubStatus = SocketService.subscribe('device:status', (payload) => {
        if (!payload?.status) return;
        setDevice((d) => d ? { ...d, status: payload.status } : d);
      });
    });

    return () => {
      cancelled = true;
      unsubReading?.();
      unsubStatus?.();
      SocketService.emit('leave:device', device.id);
    };
  }, [device?.id]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error || !device) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Device not found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sensorId = device.deviceId || deviceStringId;
  const badgeColor = STATUS_COLOR[device.status] || '#94A3B8';
  const vocQuality = getVocQuality(device.voc);

  return (
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <SectionHeader title="Device Details" />

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title}>{device.name}</Text>
            <Text style={styles.subtitle}>{device.location || 'Unknown location'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badgeColor + '22' }]}>
            <Text style={[styles.statusText, { color: badgeColor }]}>
              {(device.status || 'unknown').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Temperature</Text>
            <Text style={styles.statValue}>
              {device.temperature != null ? `${device.temperature}°C` : '--'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Humidity</Text>
            <Text style={styles.statValue}>
              {device.humidity != null ? `${device.humidity}%` : '--'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>VOC Index</Text>
            <Text style={[styles.statValue, { color: vocQuality.color }]}>
              {device.voc != null ? device.voc : '--'}
            </Text>
            {device.voc != null && (
              <Text style={[styles.vocLabel, { color: vocQuality.color }]}>{vocQuality.label}</Text>
            )}
          </View>
        </View>

        <View style={styles.infoList}>
          <InfoRow label="Device ID" value={device.deviceId || '--'} />
          <InfoRow label="Door Status" value={device.doorStatus || '--'} />
          {device.vegetable ? <InfoRow label="Vegetable" value={device.vegetable} /> : null}
          {device.lastSeen ? (
            <InfoRow
              label="Last Seen"
              value={new Date(device.lastSeen).toLocaleString()}
            />
          ) : null}
        </View>
      </View>

      <SectionHeader title="Actions" />
      <View style={styles.actionsRow}>
        <ActionBtn
          icon="bar-chart-outline"
          label="History"
          onPress={() => navigation.navigate('SensorHistory', { deviceId: sensorId })}
        />
        <ActionBtn
          icon="notifications-outline"
          label="Alerts"
          onPress={() => navigation.navigate('AlertDetail', { deviceId: sensorId })}
        />
        <ActionBtn
          icon="speedometer-outline"
          label="Stats"
          onPress={() => navigation.navigate('DeviceStats', { deviceId: sensorId })}
        />
        <ActionBtn
          icon="create-outline"
          label="Manual"
          onPress={() => navigation.navigate('ManualReading', { deviceId: sensorId })}
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={18} color="#2563EB" />
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollRoot: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#64748B', textAlign: 'center', marginTop: 12, marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
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
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#64748B' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusText: { fontWeight: '700', fontSize: 12 },
  statRow: { flexDirection: 'row', marginBottom: 20, gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  statLabel: { color: '#64748B', fontSize: 13, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  vocLabel: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  infoList: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 16 },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  infoLabel: { color: '#94A3B8', fontSize: 13 },
  infoValue: { color: '#0f172a', fontWeight: '700', fontSize: 13, maxWidth: '60%', textAlign: 'right' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    marginHorizontal: 4,
  },
  actionText: { marginTop: 10, fontWeight: '700', color: '#2563EB', fontSize: 13 },
});
