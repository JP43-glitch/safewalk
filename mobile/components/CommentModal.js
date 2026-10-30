// CommentModal — add comment with day/night toggle
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { addComment } from "../api/client";

export default function CommentModal({ visible, onClose, placeId, placeName, userId, onSuccess }) {
  const [text, setText] = useState("");
  const [timeOfDay, setTimeOfDay] = useState(null); // "day" | "night" | null
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return Alert.alert("Empty comment", "Please write something.");
    setLoading(true);
    try {
      const { data } = await addComment(placeId, userId, text.trim(), timeOfDay);
      setText("");
      setTimeOfDay(null);
      onClose();
      onSuccess(data);
    } catch (err) {
      if (err.response?.status === 429) {
        Alert.alert("Slow down", "Please wait a few seconds.");
      } else {
        Alert.alert("Error", "Could not post comment. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Comment on {placeName}</Text>
          <Text style={styles.subtitle}>Your comment is anonymous</Text>

          <TextInput
            style={styles.input}
            placeholder="Describe your experience..."
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Day / Night toggle */}
          <Text style={styles.toggleLabel}>Time of experience:</Text>
          <View style={styles.toggleRow}>
            {[
              { val: "day", emoji: "☀️", label: "Day" },
              { val: "night", emoji: "🌙", label: "Night" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.val}
                style={[styles.toggleBtn, timeOfDay === opt.val && styles.toggleActive]}
                onPress={() => setTimeOfDay(timeOfDay === opt.val ? null : opt.val)}
              >
                <Text style={styles.toggleEmoji}>{opt.emoji}</Text>
                <Text style={[styles.toggleText, timeOfDay === opt.val && styles.toggleTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  handle: {
    width: 40, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2,
    alignSelf: "center", marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1F2937", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#9CA3AF", marginBottom: 16 },
  input: {
    backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 12, padding: 14, fontSize: 15, color: "#1F2937",
    minHeight: 100, marginBottom: 16,
  },
  toggleLabel: { fontSize: 13, color: "#6B7280", marginBottom: 8, fontWeight: "600" },
  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  toggleBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  toggleActive: { borderColor: "#7C3AED", backgroundColor: "#F3E8FF" },
  toggleEmoji: { fontSize: 16, marginRight: 6 },
  toggleText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  toggleTextActive: { color: "#7C3AED" },
  submitBtn: {
    backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 16,
    alignItems: "center", marginBottom: 12,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelText: { color: "#6B7280", fontSize: 15 },
});
