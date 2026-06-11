import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';
import {AlertsService} from '../services/alerts.service';
import {AuthService} from '../services/auth.service';

export default function AlertDetailScreen({route}) {
  const {alertId, deviceId} = route.params || {};
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const a = alertId ? await AlertsService.getById(alertId) : {id: '--', deviceId};
        setAlert(a);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [alertId, deviceId]);

  const ack = async () => {
    const user = await AuthService.getCurrentUser();
    const r = await AlertsService.acknowledge(alert.id, user);
    setAlert({...alert, status: r.status});
  };

  const resolve = async () => {
    const user = await AuthService.getCurrentUser();
    const r = await AlertsService.resolve(alert.id, user);
    setAlert({...alert, status: r.status});
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </ScreenContainer>
    );
  }

  if (!alert) {
    return (
      <ScreenContainer>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Alert details are not available.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <SectionHeader title="Alert Details" />

      <View style={styles.card}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>{alert.type}</Text>
            <Text style={styles.subtitle}>{alert.deviceName || alert.deviceId}</Text>
          </View>

          <View style={styles.badgeContainer}>
            <View style={[styles.badge, styles.severityBadge]}>
              <Text style={styles.badgeText}>{alert.severity}</Text>
            </View>
            <View style={[styles.badge, styles.statusBadge]}>
              <Text style={styles.statusText}>{alert.status}</Text>
            </View>
          </View>
        </View>

        {alert.message ? <Text style={styles.message}>{alert.message}</Text> : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Device ID</Text>
          <Text style={styles.detailValue}>{alert.deviceId || '--'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Unknown'}</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={ack}>
          <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Acknowledge</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={resolve}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
          <Text style={[styles.actionText, styles.secondaryText]}>Resolve</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 14,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 8,
  },
  severityBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusBadge: {
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  message: {
    color: '#475569',
    lineHeight: 22,
    marginBottom: 20,
    fontSize: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  detailValue: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderColor: '#DBEAFE',
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryText: {
    color: '#2563EB',
  },
});
