// Legend — green/yellow/red meaning
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ITEMS = [
  { color: "#22C55E", label: "Safe" },
  { color: "#EAB308", label: "Caution" },
  { color: "#EF4444", label: "Unsafe" },
];

export default function Legend() {
  return (
    <View style={styles.container}>
      {ITEMS.map((item) => (
        <View key={item.label} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute", bottom: 110, left: 16,
    backgroundColor: "#ffffffee", borderRadius: 12, padding: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  label: { fontSize: 12, color: "#374151", fontWeight: "600" },
});
