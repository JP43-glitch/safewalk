// PlaceDetailSheet — bottom sheet with place info, comments, and add comment button
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, FlatList, Modal, StyleSheet,
  ActivityIndicator, Animated, Dimensions,
} from "react-native";
import { getPlace } from "../api/client";

const COLOR_HEX = { green: "#22C55E", yellow: "#EAB308", red: "#EF4444" };
const COLOR_LABEL = { green: "Safe", yellow: "Be careful", red: "Unsafe" };
const CATEGORY_EMOJI = {
  harassment: "⚠️", groping: "🚨", stalking: "👁️", eve_teasing: "😠",
  unsafe_environment: "🔶", poor_lighting: "🌑", theft: "💰", safe: "✅", spam: "🗑️",
};

const { height: SCREEN_H } = Dimensions.get("window");

function timeAgo(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function PlaceDetailSheet({ placeId, visible, onClose, onAddComment, refreshKey }) {
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchPlace = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    setError(false);
    try {
      const { data } = await getPlace(placeId);
      setPlace(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [placeId, refreshKey]);

  useEffect(() => {
    if (visible && placeId) fetchPlace();
  }, [visible, placeId, refreshKey]);

  if (!visible) return null;

  const badgeColor = place ? COLOR_HEX[place.color] : "#9CA3AF";
  const badgeLabel = place ? COLOR_LABEL[place.color] : "...";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />

          {loading && !place && (
            <ActivityIndicator color="#7C3AED" style={{ marginVertical: 40 }} />
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Could not load place</Text>
              <TouchableOpacity onPress={fetchPlace} style={styles.retryBtn}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {place && (
            <>
              {/* Header */}
              <Text style={styles.name}>{place.name}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: badgeColor }]}>  
                  <Text style={styles.badgeText}>{badgeLabel}</Text>
                </View>
                <Text style={styles.score}>{place.score}/100</Text>
              </View>

              {/* Comments */}
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Recent reports</Text>
                <Text style={styles.commentCount}>{place.comments?.length || 0}</Text>
              </View>

              <FlatList
                data={place.comments || []}
                keyExtractor={(c) => c.id}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.empty}>No comments yet</Text>}
                renderItem={({ item }) => (
                  <View style={styles.commentCard}>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <View style={styles.commentMeta}>
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>
                          {CATEGORY_EMOJI[item.category] || "❓"} {item.category.replace("_", " ")} · {item.severity}
                        </Text>
                      </View>
                      {item.timeOfDay && (
                        <Text style={styles.timeOfDay}>{item.timeOfDay === "night" ? "🌙" : "☀️"}</Text>
                      )}
                      <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
                    </View>
                  </View>
                )}
              />

              {/* Add comment button */}
              <TouchableOpacity style={styles.addBtn} onPress={onAddComment}>
                <Text style={styles.addBtnText}>＋ Add comment</Text>
              </TouchableOpacity>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32, maxHeight: SCREEN_H * 0.7,
  },
  handle: {
    width: 40, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2,
    alignSelf: "center", marginBottom: 14,
  },
  name: { fontSize: 20, fontWeight: "800", color: "#1F2937", marginBottom: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  score: { marginLeft: 12, fontSize: 16, fontWeight: "700", color: "#6B7280" },
  commentsHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  commentsTitle: { fontSize: 15, fontWeight: "700", color: "#374151" },
  commentCount: {
    marginLeft: 8, backgroundColor: "#F3F4F6", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2, fontSize: 12, color: "#6B7280", fontWeight: "600",
  },
  list: { maxHeight: SCREEN_H * 0.35 },
  empty: { color: "#9CA3AF", fontSize: 14, textAlign: "center", paddingVertical: 20 },
  commentCard: {
    backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12, marginBottom: 8,
  },
  commentText: { fontSize: 14, color: "#1F2937", marginBottom: 8, lineHeight: 20 },
  commentMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#EDE9FE", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  chipText: { fontSize: 11, color: "#6D28D9", fontWeight: "600" },
  timeOfDay: { fontSize: 14 },
  timeAgo: { fontSize: 11, color: "#9CA3AF" },
  addBtn: {
    backgroundColor: "#7C3AED", borderRadius: 14, paddingVertical: 14,
    alignItems: "center", marginTop: 12,
  },
  addBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
