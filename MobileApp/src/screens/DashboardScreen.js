import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardService } from '../services/dashboard.service';
import { SocketService } from '../services/socket.service';
import SectionHeader from '../components/SectionHeader';
import DeviceCard from '../components/DeviceCard';
import DashboardSkeleton from '../components/DashboardSkeleton';

const StatCard = ({ label, value, icon, color, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={[styles.statCard, { backgroundColor: color }]}
    onPress={onPress}
  >
    <View style={styles.iconContainer}>
      <Ionicons name={icon} size={26} color="#fff" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const d = await DashboardService.getOverview();
      setData(d);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load dashboard. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let unsubUpdate, unsubAlert;
    let cancelled = false;
    SocketService.connect().then(() => {
      if (cancelled) return;
      unsubUpdate = SocketService.subscribe('dashboard:update', () => load(true));
      unsubAlert = SocketService.subscribe('alert:new', () => load(true));
    });
    return () => {
      cancelled = true;
      unsubUpdate?.();
      unsubAlert?.();
    };
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  if (loading) {
    return (
      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <DashboardSkeleton />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={styles.errorContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Ionicons name="cloud-offline-outline" size={56} color="#CBD5E1" />
        <Text style={styles.errorTitle}>Couldn't Load Dashboard</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Devices"
          value={data?.totalDevices ?? 0}
          icon="cube-outline"
          color="#2563EB"
          onPress={() => navigation.navigate('Devices')}
        />
        <StatCard
          label="Online"
          value={data?.onlineDevices ?? 0}
          icon="checkmark-circle"
          color="#16A34A"
          onPress={() => navigation.navigate('Devices')}
        />
        <StatCard
          label="Offline"
          value={data?.offlineDevices ?? 0}
          icon="cloud-offline"
          color="#EF4444"
          onPress={() => navigation.navigate('Devices')}
        />
        <StatCard
          label="Active Alerts"
          value={data?.activeAlerts ?? 0}
          icon="notifications"
          color="#F59E0B"
          onPress={() => navigation.navigate('Alerts')}
        />
        <StatCard
          label="Critical"
          value={data?.criticalAlerts ?? 0}
          icon="warning"
          color="#DC2626"
          onPress={() => navigation.navigate('Alerts')}
        />
      </View>

      {data?.assignedDevices?.length > 0 && (
        <>
          <SectionHeader title="Devices" />
          <View style={styles.section}>
            {data.assignedDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onPress={() =>
                  navigation.navigate('DeviceDetail', {
                    deviceId: device.id,
                    deviceStringId: device.deviceId,
                  })
                }
              />
            ))}
          </View>
        </>
      )}

      {data?.recentAlerts?.length > 0 && (
        <>
          <SectionHeader title="Recent Alerts" />
          <View style={styles.section}>
            {data.recentAlerts.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={styles.alertCard}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('AlertDetail', { alertId: alert.id })
                }
              >
                <View style={styles.alertIcon}>
                  <Ionicons name="warning-outline" size={22} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{alert.type}</Text>
                  <Text style={styles.alertDevice}>{alert.deviceName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollRoot: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, paddingBottom: 100 },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48%',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  statValue: { fontSize: 26, fontWeight: '800', color: '#fff' },
  statLabel: { marginTop: 4, fontSize: 13, color: '#fff', opacity: 0.95 },
  section: { marginTop: 8, marginBottom: 18 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  alertDevice: { fontSize: 13, color: '#64748B', marginTop: 2 },
});
