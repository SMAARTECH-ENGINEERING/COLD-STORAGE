import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SectionHeader({ title, right }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  title: { fontWeight: "700" },
});
