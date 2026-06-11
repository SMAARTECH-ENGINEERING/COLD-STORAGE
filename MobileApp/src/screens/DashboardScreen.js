import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DashboardService } from "../services/dashboard.service";
import ScreenContainer from "../components/ScreenContainer";
import SectionHeader from "../components/SectionHeader";
import DeviceCard from "../components/DeviceCard";
import DashboardSkeleton from "../components/DashboardSkeleton.js";

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

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const d = await DashboardService.getOverview();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer scroll contentStyle={styles.container}>
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }
  return (
    <ScreenContainer scroll contentStyle={styles.container}>
      {/* <Text style={styles.heading}>Dashboard</Text> */}
      {/* <Text style={styles.subHeading}>
        Monitor your cold storage devices in real-time
      </Text> */}

      <View style={styles.statsGrid}>
        <StatCard
          label="Total Devices"
          value={data?.totalDevices || 0}
          icon="cube-outline"
          color="#2563EB"
          onPress={() => navigation.navigate("Devices")}
        />

        <StatCard
          label="Online"
          value={data?.onlineDevices || 0}
          icon="checkmark-circle"
          color="#16A34A"
          onPress={() => navigation.navigate("Devices")}
        />

        <StatCard
          label="Offline"
          value={data?.offlineDevices || 0}
          icon="cloud-offline"
          color="#EF4444"
          onPress={() => navigation.navigate("Devices")}
        />

        <StatCard
          label="Active Alerts"
          value={data?.activeAlerts || 0}
          icon="notifications"
          color="#F59E0B"
          onPress={() => navigation.navigate("Alerts")}
        />

        <StatCard
          label="Critical"
          value={data?.criticalAlerts || 0}
          icon="warning"
          color="#DC2626"
          onPress={() => navigation.navigate("Alerts")}
        />
      </View>

      <SectionHeader title="Assigned Devices" />

      <View style={styles.section}>
        {data?.assignedDevices?.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onPress={() => navigation.navigate("DeviceDetail", { deviceId: device.id })}
          />
        ))}
      </View>

      <SectionHeader title="Recent Alerts" />

      <View style={styles.section}>
        {data?.recentAlerts?.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={styles.alertCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("AlertDetail", { alertId: alert.id })}
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 44,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,

    elevation: 5,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 13,
    color: "#fff",
    opacity: 0.95,
  },

  section: {
    marginTop: 8,
    marginBottom: 18,
  },

  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",

    padding: 14,
    borderRadius: 16,
    marginBottom: 10,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,

    elevation: 3,
  },

  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  alertDevice: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
});
