// LoginScreen — name input, auth, location permission
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { authDemo } from "../api/client";

export default function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) return Alert.alert("Name required", "Please enter your name to continue.");
    setLoading(true);
    try {
      const { data } = await authDemo(trimmed);
      onLogin(data); // { userId, name }
    } catch (err) {
      Alert.alert("Connection error", "Could not reach the server. Check your API_URL in config.js and make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.inner}>
        {/* Logo area */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🚶‍♀️</Text>
          <Text style={styles.title}>SafeWalk</Text>
          <Text style={styles.tagline}>Know before you go.</Text>
        </View>

        {/* Input */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="go"
            onSubmitEditing={handleContinue}
          />
          <TouchableOpacity
            style={[styles.button, !name.trim() && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Your identity stays anonymous. Name is only for session.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  inner: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  logoContainer: { alignItems: "center", marginBottom: 48 },
  logo: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 36, fontWeight: "800", color: "#7C3AED", letterSpacing: 1 },
  tagline: { fontSize: 16, color: "#6B7280", marginTop: 8, fontStyle: "italic" },
  form: { width: "100%", maxWidth: 340 },
  input: {
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E5E7EB",
    borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14,
    fontSize: 16, color: "#1F2937", marginBottom: 16,
  },
  button: {
    backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  footer: { marginTop: 24, fontSize: 12, color: "#9CA3AF", textAlign: "center" },
});
