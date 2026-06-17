import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DevicesService } from '../services/devices.service';
import { SocketService } from '../services/socket.service';
import DeviceCard from '../components/DeviceCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';

const FILTERS = ['All', 'Online', 'Offline'];

export default function DeviceListScreen({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await DevicesService.list(
        filter === 'All' ? null : filter.toLowerCase()
      );
      setDevices(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load devices.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let unsub;
    let cancelled = false;
    SocketService.connect().then(() => {
      if (cancelled) return;
      unsub = SocketService.subscribe('dashboard:update', () => load(true));
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const filtered = useMemo(
    () =>
      devices.filter((d) =>
        [d.name, d.deviceId, d.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [devices, query]
  );

  return (
    <View style={styles.root}>
      {/* Search + filter row */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search devices..." />
        </View>
        {FILTERS.map((f) => {
          const active = filter === f;
          const activeStyle =
            f === 'Online'
              ? styles.onlineActive
              : f === 'Offline'
              ? styles.offlineActive
              : styles.allActive;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, active && activeStyle]}
              onPress={() => setFilter(f)}
            >
              <Ionicons
                name={
                  f === 'Online'
                    ? 'checkmark-circle'
                    : f === 'Offline'
                    ? 'close-circle'
                    : 'grid-outline'
                }
                size={20}
                color={
                  active
                    ? '#fff'
                    : f === 'Online'
                    ? '#10B981'
                    : f === 'Offline'
                    ? '#EF4444'
                    : '#2563EB'
                }
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.deviceCount}>
          {loading ? 'Loading…' : `${filtered.length} Device${filtered.length !== 1 ? 's' : ''}`}
        </Text>
        <View style={styles.filterPill}>
          <Text style={styles.filterLabel}>{filter}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DeviceCard
              device={item}
              onPress={() =>
                navigation.navigate('DeviceDetail', {
                  deviceId: item.id,
                  deviceStringId: item.deviceId,
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading && (
              <EmptyState
                icon="hardware-chip-outline"
                message={query ? 'No devices match your search.' : 'No devices found.'}
              />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16, backgroundColor: '#F8FAFC' },
  topBar: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  allActive: { backgroundColor: '#2563EB' },
  onlineActive: { backgroundColor: '#10B981' },
  offlineActive: { backgroundColor: '#EF4444' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceCount: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  filterLabel: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  listContent: { paddingBottom: 100 },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#64748B', textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
