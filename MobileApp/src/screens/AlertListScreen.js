import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AlertsService} from '../services/alerts.service';
import AlertCard from '../components/AlertCard';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import ScreenContainer from '../components/ScreenContainer';

export default function AlertListScreen({navigation}) {
  const [alerts, setAlerts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await AlertsService.list();
      setAlerts(r || []);
    } catch (error) {
      console.warn('Failed to load alerts', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    if (!searchTerm) return alerts;

    return alerts.filter(alert => {
      const combined = [
        alert.type,
        alert.deviceName,
        alert.severity,
        alert.message,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return combined.includes(searchTerm);
    });
  }, [alerts, query]);

  return (
    <ScreenContainer style={styles.root}>
      {/* <View style={styles.headerWrapper}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>Monitor device warnings and take action quickly.</Text>
        </View>

        <View style={styles.countPill}>
          <Text style={styles.countText}>{alerts.length} Alerts</Text>
        </View>
      </View> */}

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search by device, type or severity"
      />

      <View style={styles.actionRow}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        <TouchableOpacity
          style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
          onPress={load}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Ionicons name="reload-outline" size={18} color="#ffffff" />
          <Text style={styles.refreshText}>{loading ? 'Refreshing' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAlerts}
        keyExtractor={item => String(item.id)}
        renderItem={({item}) => (
          <AlertCard
            alert={item}
            onPress={() => navigation.navigate('AlertDetail', {alertId: item.id})}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            message={loading ? 'Loading alerts...' : 'No alerts found. Try refreshing.'}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#f7fafc',
  },
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  countPill: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  refreshText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  separator: {
    height: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
});
