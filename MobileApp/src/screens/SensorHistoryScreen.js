import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SecureStore from 'expo-secure-store';
import { SensorsService } from '../services/sensors.service';
import { getVocQuality } from '../utils/voc';
import { TOKEN_KEYS } from '../config/env';
import SectionHeader from '../components/SectionHeader';

const CHART_WIDTH = Dimensions.get('window').width - 48;

const RANGES = [
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
];

export default function SensorHistoryScreen({ route }) {
  const { deviceId } = route.params || {};
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const h = await SensorsService.getHistory(deviceId, range);
      setHistory(h || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [deviceId, range]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
      const url = SensorsService.getExportUrl(deviceId, range, format);
      const fileUri = `${FileSystem.documentDirectory}${deviceId}-history.${format}`;
      const { uri } = await FileSystem.downloadAsync(url, fileUri, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      // Download/share failure — nothing to recover, button stays available to retry
    } finally {
      setExporting(null);
    }
  };

  const temps = history.map((r) => r.temperature ?? 0);
  const labels = history.length <= 8
    ? history.map((r) => new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    : history.map((_, i) => (i % Math.ceil(history.length / 6) === 0 ? `${i + 1}` : ''));

  return (
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <SectionHeader title="Sensor History" />

      {/* Range selector */}
      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.rangeBtn, range === r.value && styles.rangeBtnActive]}
            onPress={() => setRange(r.value)}
          >
            <Text style={[styles.rangeTxt, range === r.value && styles.rangeTxtActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Export buttons */}
      <View style={styles.exportRow}>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => handleExport('xlsx')}
          disabled={exporting != null}
        >
          {exporting === 'xlsx' ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Ionicons name="grid-outline" size={16} color="#2563EB" />
          )}
          <Text style={styles.exportText}>Excel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => handleExport('pdf')}
          disabled={exporting != null}
        >
          {exporting === 'pdf' ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Ionicons name="document-text-outline" size={16} color="#2563EB" />
          )}
          <Text style={styles.exportText}>PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Temperature Trend (°C)</Text>
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : error ? (
          <Text style={styles.noData}>{error}</Text>
        ) : temps.length > 0 ? (
          <LineChart
            data={{ labels, datasets: [{ data: temps }] }}
            width={CHART_WIDTH}
            height={220}
            withInnerLines={false}
            withOuterLines={false}
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: () => '#2563EB',
              strokeWidth: 2,
              labelColor: () => '#94A3B8',
              propsForDots: { r: '4', fill: '#1D4ED8' },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noData}>No data for the selected range.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Readings</Text>
        {loading ? (
          <ActivityIndicator style={{ paddingVertical: 24 }} color="#2563EB" />
        ) : history.length > 0 ? (
          history.slice(0, 20).map((reading, i) => (
            <View key={i} style={styles.readingRow}>
              <View style={styles.readingHeader}>
                <Text style={styles.readingTime}>
                  {new Date(reading.timestamp).toLocaleString()}
                </Text>
                <View style={styles.doorTag}>
                  <Ionicons
                    name={reading.doorStatus === 'Open' ? 'lock-open-outline' : 'lock-closed-outline'}
                    size={12}
                    color={reading.doorStatus === 'Open' ? '#F59E0B' : '#10B981'}
                  />
                  <Text style={[styles.doorText, { color: reading.doorStatus === 'Open' ? '#F59E0B' : '#10B981' }]}>
                    {reading.doorStatus}
                  </Text>
                </View>
              </View>
              <View style={styles.readingValues}>
                <Text style={styles.readingValue}>
                  🌡 {reading.temperature ?? '--'}°C
                </Text>
                <Text style={styles.readingValue}>
                  💧 {reading.humidity ?? '--'}%
                </Text>
                <Text style={[styles.readingValue, { color: getVocQuality(reading.voc).color }]}>
                  🧪 {reading.voc ?? '--'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>No readings found.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollRoot: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, paddingBottom: 60 },
  rangeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  rangeBtnActive: { backgroundColor: '#2563EB' },
  rangeTxt: { fontWeight: '600', color: '#64748B', fontSize: 14 },
  rangeTxtActive: { color: '#fff' },
  exportRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exportText: { color: '#2563EB', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  chart: { borderRadius: 18 },
  loaderBox: { minHeight: 220, justifyContent: 'center', alignItems: 'center' },
  noData: { color: '#64748B', fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  readingRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readingTime: { color: '#0f172a', fontWeight: '600', fontSize: 12 },
  doorTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doorText: { fontSize: 12, fontWeight: '600' },
  readingValues: { flexDirection: 'row', gap: 20 },
  readingValue: { color: '#475569', fontSize: 14, fontWeight: '600' },
});
