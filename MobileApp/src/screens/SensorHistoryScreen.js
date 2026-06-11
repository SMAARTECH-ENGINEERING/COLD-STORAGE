import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {SensorsService} from '../services/sensors.service';
import {LineChart} from 'react-native-chart-kit';
import ScreenContainer from '../components/ScreenContainer';
import SectionHeader from '../components/SectionHeader';

const screenWidth = Dimensions.get('window').width - 40;

export default function SensorHistoryScreen({route}) {
  const {deviceId} = route.params || {};
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const h = await SensorsService.getHistory(deviceId);
        setHistory(h || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [deviceId]);

  const temperatures = history.map(item => item.temperature);
  const labels = history.map((_, index) => `${index + 1}`);

  return (
    <ScreenContainer scroll>
      <SectionHeader title="Sensor History" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Temperature Trend</Text>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : temperatures.length ? (
          <LineChart
            data={{labels, datasets: [{data: temperatures}]}}
            width={screenWidth}
            height={220}
            withInnerLines={false}
            withOuterLines={false}
            chartConfig={{
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: () => '#2563EB',
              strokeWidth: 2,
              propsForDots: {
                r: '4',
                fill: '#1D4ED8',
              },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>No temperature history available yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Readings</Text>
        {history.length ? (
          history.map((reading, index) => (
            <View key={index} style={styles.readingRow}>
              <View style={styles.readingHeader}>
                <Text style={styles.readingTime}>{new Date(reading.timestamp).toLocaleString()}</Text>
                <Text style={styles.readingLabel}>{reading.doorStatus}</Text>
              </View>
              <View style={styles.readingValues}>
                <Text style={styles.readingValue}>Temp: {reading.temperature}°</Text>
                <Text style={styles.readingValue}>Humidity: {reading.humidity}%</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No recent readings found.</Text>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },
  chart: {
    borderRadius: 18,
  },
  loader: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  readingRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  readingTime: {
    color: '#0f172a',
    fontWeight: '700',
  },
  readingLabel: {
    color: '#2563EB',
    fontWeight: '700',
  },
  readingValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readingValue: {
    color: '#475569',
    fontSize: 14,
  },
});
