import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SensorsService } from '../services/sensors.service';
import { getVocQuality } from '../utils/voc';
import SectionHeader from '../components/SectionHeader';

const PERIODS = [
  { label: '6h', value: 6 },
  { label: '24h', value: 24 },
  { label: '7d', value: 168 },
];

function StatRow({ icon, label, value, color }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={color || '#64748B'} style={styles.rowIcon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, color && { color }]}>{value}</Text>
    </View>
  );
}

export default function DeviceStatsScreen({ route }) {
  const { deviceId } = route.params || {};
  const [stats, setStats] = useState(null);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const s = await SensorsService.getStats(deviceId, hours);
      setStats(s);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceId, hours]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const fmt = (val, suffix = '') =>
    val != null ? `${Number(val).toFixed(1)}${suffix}` : '--';

  return (
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <SectionHeader title="Device Statistics" />

      {/* Period selector */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[styles.periodBtn, hours === p.value && styles.periodBtnActive]}
            onPress={() => setHours(p.value)}
          >
            <Text style={[styles.periodTxt, hours === p.value && styles.periodTxtActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Temperature (°C)</Text>
            <StatRow icon="thermometer-outline" label="Average" value={fmt(stats?.avgTemp, '°')} color="#2563EB" />
            <StatRow icon="arrow-down-outline" label="Minimum" value={fmt(stats?.minTemp, '°')} color="#10B981" />
            <StatRow icon="arrow-up-outline" label="Maximum" value={fmt(stats?.maxTemp, '°')} color="#EF4444" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Humidity (%)</Text>
            <StatRow icon="water-outline" label="Average" value={fmt(stats?.avgHumidity, '%')} color="#2563EB" />
            <StatRow icon="arrow-down-outline" label="Minimum" value={fmt(stats?.minHumidity, '%')} color="#10B981" />
            <StatRow icon="arrow-up-outline" label="Maximum" value={fmt(stats?.maxHumidity, '%')} color="#EF4444" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Activity</Text>
            <StatRow
              icon="bar-chart-outline"
              label="Total Readings"
              value={stats?.readingsCount ?? '--'}
              color="#7C3AED"
            />
            <StatRow
              icon="snow-outline"
              label="Compressor On"
              value={stats?.compressorOnCount ?? '--'}
              color="#0EA5E9"
            />
          </View>

          {stats?.avgVoc != null && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>VOC Index</Text>
              <StatRow
                icon="cloud-outline"
                label="Average"
                value={`${fmt(stats.avgVoc)} (${getVocQuality(stats.avgVoc).label})`}
                color={getVocQuality(stats.avgVoc).color}
              />
              {stats?.maxVoc != null && (
                <StatRow
                  icon="arrow-up-outline"
                  label="Maximum"
                  value={`${fmt(stats.maxVoc)} (${getVocQuality(stats.maxVoc).label})`}
                  color={getVocQuality(stats.maxVoc).color}
                />
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollRoot: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, paddingBottom: 60 },
  periodRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodBtnActive: { backgroundColor: '#2563EB' },
  periodTxt: { fontWeight: '600', color: '#64748B', fontSize: 14 },
  periodTxtActive: { color: '#fff' },
  center: { alignItems: 'center', paddingVertical: 48 },
  errorText: { color: '#64748B', textAlign: 'center', marginTop: 12, marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIcon: { marginRight: 10 },
  label: { color: '#64748B', fontSize: 14 },
  value: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
});
