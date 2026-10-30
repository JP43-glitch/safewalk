// Banner — live update notification at top of screen
import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";

const COLOR_MAP = { green: "#22C55E", yellow: "#EAB308", red: "#EF4444" };

export default function Banner({ message, color, visible, onHide }) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide && onHide());
    }
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: COLOR_MAP[color] || "#7C3AED", transform: [{ translateY }] }]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingTop: 54, paddingBottom: 14, paddingHorizontal: 20,
    zIndex: 1000,
  },
  text: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "center" },
});
