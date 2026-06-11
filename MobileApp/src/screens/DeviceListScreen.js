import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

import {DevicesService} from '../services/devices.service';
import ScreenContainer from '../components/ScreenContainer';
import DeviceCard from '../components/DeviceCard';
import SearchBar from '../components/SearchBar';

export default function DeviceListScreen({navigation}) {
  const [devices, setDevices] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    load();
  }, [filter]);

  const load = async () => {
    try {
      const data = await DevicesService.list(
        filter === 'All' ? null : filter.toLowerCase(),
      );
      setDevices(data);
    } catch (error) {
      console.log(error);
    }
  };

  const onSelect = device => {
    navigation.navigate('DeviceDetail', {
      deviceId: device.id,
    });
  };

  const filteredDevices = useMemo(() => {
    return devices.filter(device =>
      device.name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [devices, query]);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Search + Filters */}
        <View style={styles.topBar}>
          <View style={styles.searchContainer}>
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search devices..."
            />
          </View>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'All' && styles.activeFilter,
            ]}
            onPress={() => setFilter('All')}>
            <Ionicons
              name="grid-outline"
              size={20}
              color={filter === 'All' ? '#fff' : '#2563EB'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'Online' && styles.onlineActive,
            ]}
            onPress={() => setFilter('Online')}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={filter === 'Online' ? '#fff' : '#10B981'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'Offline' && styles.offlineActive,
            ]}
            onPress={() => setFilter('Offline')}>
            <Ionicons
              name="close-circle"
              size={20}
              color={filter === 'Offline' ? '#fff' : '#EF4444'}
            />
          </TouchableOpacity>
        </View>

        {/* Device Count */}
        <View style={styles.infoRow}>
          <Text style={styles.deviceCount}>
            {filteredDevices.length} Device
            {filteredDevices.length !== 1 ? 's' : ''}
          </Text>

          <Text style={styles.filterLabel}>{filter}</Text>
        </View>

        {/* Device List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}>
          {filteredDevices.length > 0 ? (
            filteredDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                onPress={onSelect}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="hardware-chip-outline"
                size={60}
                color="#CBD5E1"
              />

              <Text style={styles.emptyTitle}>
                No Devices Found
              </Text>

              <Text style={styles.emptyText}>
                Try changing the search text or filter.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  searchContainer: {
    flex: 1,
  },

  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#FFFFFF',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },

  activeFilter: {
    backgroundColor: '#2563EB',
  },

  onlineActive: {
    backgroundColor: '#10B981',
  },

  offlineActive: {
    backgroundColor: '#EF4444',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  deviceCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },

  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  listContent: {
    paddingBottom: 30,
  },

  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});