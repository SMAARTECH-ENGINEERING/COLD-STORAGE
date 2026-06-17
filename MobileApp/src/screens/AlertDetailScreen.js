import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SectionHeader from '../components/SectionHeader';
import { AlertsService } from '../services/alerts.service';

const SEVERITY_COLOR = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626',
};

const STATUS_BG = {
  active: '#FEE2E2',
  acknowledged: '#FEF3C7',
  resolved: '#D1FAE5',
};

const STATUS_TEXT = {
  active: '#B91C1C',
  acknowledged: '#92400E',
  resolved: '#065F46',
};

export default function AlertDetailScreen({ route }) {
  const { alertId } = route.params || {};
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!alertId) { setLoading(false); return; }
    AlertsService.getById(alertId)
      .then(setAlert)
      .catch((e) => setError(e?.response?.data?.message || 'Alert not found.'))
      .finally(() => setLoading(false));
  }, [alertId]);

  const doAction = async (action) => {
    setActioning(true);
    try {
      const updated =
        action === 'acknowledge'
          ? await AlertsService.acknowledge(alert.id)
          : await AlertsService.resolve(alert.id);
      setAlert(updated);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error || !alert) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{error || 'Alert details are not available.'}</Text>
      </View>
    );
  }

  const statusKey = alert.status?.toLowerCase() || 'active';
  const severityKey = alert.severity?.toLowerCase() || 'medium';
  const severityColor = SEVERITY_COLOR[severityKey] || '#64748B';
  const isResolved = statusKey === 'resolved';

  return (
    <ScrollView style={styles.scrollRoot} contentContainerStyle={styles.container}>
      <SectionHeader title="Alert Details" />

      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title}>{alert.type}</Text>
            <Text style={styles.subtitle}>{alert.deviceName || alert.deviceId}</Text>
          </View>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: severityColor + '22' }]}>
              <Text style={[styles.badgeText, { color: severityColor }]}>
                {alert.severity?.toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: STATUS_BG[statusKey] || '#F1F5F9' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: STATUS_TEXT[statusKey] || '#334155' },
                ]}
              >
                {alert.status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {alert.message ? <Text style={styles.message}>{alert.message}</Text> : null}

        <View style={styles.detailList}>
          <DetailRow label="Device ID" value={alert.deviceId || '--'} />
          <DetailRow
            label="Created"
            value={alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Unknown'}
          />
          {alert.value != null && (
            <DetailRow label="Measured Value" value={String(alert.value)} />
          )}
          {alert.threshold != null && (
            <DetailRow label="Threshold" value={String(alert.threshold)} />
          )}
          {alert.acknowledgedAt && (
            <DetailRow
              label="Acknowledged"
              value={new Date(alert.acknowledgedAt).toLocaleString()}
            />
          )}
          {alert.resolvedAt && (
            <DetailRow
              label="Resolved"
              value={new Date(alert.resolvedAt).toLocaleString()}
            />
          )}
        </View>
      </View>

      {!isResolved && (
        <View style={styles.buttonRow}>
          {statusKey === 'active' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => doAction('acknowledge')}
              disabled={actioning}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
              <Text style={styles.actionText}>
                {actioning ? 'Processing…' : 'Acknowledge'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => doAction('resolve')}
            disabled={actioning}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
            <Text style={[styles.actionText, styles.secondaryText]}>
              {actioning ? 'Processing…' : 'Resolve'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollRoot: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#64748B', fontSize: 15, textAlign: 'center' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
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
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  subtitle: { marginTop: 6, color: '#64748B', fontSize: 14 },
  badges: { alignItems: 'flex-end', gap: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  message: { color: '#475569', lineHeight: 22, marginBottom: 20, fontSize: 15 },
  detailList: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  detailLabel: { color: '#94A3B8', fontSize: 13 },
  detailValue: { color: '#0F172A', fontWeight: '700', fontSize: 13, maxWidth: '55%', textAlign: 'right' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  primaryButton: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  secondaryButton: { backgroundColor: '#ffffff', borderColor: '#DBEAFE' },
  actionText: { color: '#ffffff', fontWeight: '700', marginLeft: 8 },
  secondaryText: { color: '#2563EB' },
});
