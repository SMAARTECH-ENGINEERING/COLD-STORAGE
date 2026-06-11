import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

export default function AlertCard({alert, onPress}) {
  const getSeverityColor = severity => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F97316';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const severityColor = getSeverityColor(alert.severity);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.card}
      onPress={() => onPress && onPress(alert)}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View
            style={[
              styles.iconContainer,
              {backgroundColor: `${severityColor}1A`},
            ]}>
            <Ionicons
              name="warning-outline"
              size={22}
              color={severityColor}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{alert.type}</Text>
            <Text style={styles.device}>{alert.deviceName}</Text>
          </View>
        </View>

        <View
          style={[
            styles.badge,
            {backgroundColor: `${severityColor}22`},
          ]}>
          <Text
            style={[
              styles.badgeText,
              {color: severityColor},
            ]}>
            {alert.severity}
          </Text>
        </View>
      </View>

      {alert.message ? (
        <Text numberOfLines={2} style={styles.message}>
          {alert.message}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,

    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.06,
    shadowRadius: 14,

    elevation: 4,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  device: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  message: {
    marginTop: 14,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});