import React from "react";
import { View, StyleSheet } from "react-native";

const SkeletonBox = ({ style }) => <View style={[styles.skeleton, style]} />;

export default function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4, 5].map((item) => (
          <SkeletonBox key={item} style={styles.statCard} />
        ))}
      </View>

      <SkeletonBox style={styles.sectionTitle} />

      {[1, 2, 3].map((item) => (
        <SkeletonBox key={`device-${item}`} style={styles.deviceCard} />
      ))}

      <SkeletonBox style={[styles.sectionTitle, { marginTop: 20 }]} />

      {[1, 2, 3].map((item) => (
        <SkeletonBox key={`alert-${item}`} style={styles.alertCard} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },

  skeleton: {
    backgroundColor: "#CBD5E1",
    overflow: "hidden",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    height: 120,
    borderRadius: 20,
    marginBottom: 14,
  },

  sectionTitle: {
    width: 140,
    height: 24,
    borderRadius: 8,
    marginVertical: 16,
  },

  deviceCard: {
    width: "100%",
    height: 90,
    borderRadius: 18,
    marginBottom: 12,
  },

  alertCard: {
    width: "100%",
    height: 72,
    borderRadius: 16,
    marginBottom: 10,
  },
});
