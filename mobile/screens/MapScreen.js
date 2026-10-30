// MapScreen — full-screen map with search, safety circles, live updates
import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import * as Location from "expo-location";

import SafetyMap from "../components/SafetyMap";
import SearchBar from "../components/SearchBar";
import Legend from "../components/Legend";
import Banner from "../components/Banner";
import PlaceDetailSheet from "../components/PlaceDetailSheet";
import CommentModal from "../components/CommentModal";
import { getPlaces, connectSocket } from "../api/client";

const COLOR_LABEL = { green: "Safe", yellow: "Caution", red: "Unsafe" };

export default function MapScreen({ user }) {
  const [places, setPlaces] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [focusPlace, setFocusPlace] = useState(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [banner, setBanner] = useState({ visible: false, message: "", color: "green" });
  const [nearestStatus, setNearestStatus] = useState(null);
  const [error, setError] = useState(false);

  // Fetch places
  const fetchPlaces = useCallback(async () => {
    try {
      const { data } = await getPlaces();
      setPlaces(data);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  // Get location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
      // If denied, map will center on Chandigarh (default in SafetyMap)
    })();
  }, []);

  // Load places on mount
  useEffect(() => { fetchPlaces(); }, []);

  // Compute nearest place to user
  useEffect(() => {
    if (!userLocation || places.length === 0) return;
    let minDist = Infinity, nearest = null;
    places.forEach((p) => {
      const d = Math.sqrt(Math.pow(p.lat - userLocation.latitude, 2) + Math.pow(p.lng - userLocation.longitude, 2));
      if (d < minDist) { minDist = d; nearest = p; }
    });
    if (nearest) setNearestStatus(nearest);
  }, [userLocation, places]);

  const selectedPlaceIdRef = useRef(selectedPlaceId);
  useEffect(() => {
    selectedPlaceIdRef.current = selectedPlaceId;
  }, [selectedPlaceId]);

  // Socket.IO live updates
  useEffect(() => {
    const socket = connectSocket();

    const handlePlaceUpdated = (data) => {
      // Update place in state instantly
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === data.id
            ? { ...p, score: data.score, color: data.color, commentCount: (p.commentCount || 0) + 1 }
            : p
        )
      );

      // Pulse the updated circle
      SafetyMap.triggerPulse(setFocusPlace, {
        id: data.id,
        score: data.score,
        color: data.color,
      });

      // Show banner at top
      const colorLabel = data.color === "green" ? "Safe ✅" : data.color === "yellow" ? "Caution ⚠️" : "Unsafe 🚨";
      setBanner({
        visible: true,
        message: `${data.name} is now ${colorLabel} (score ${data.score})`,
        color: data.color,
      });

      // Refresh open sheet if it's currently showing this place
      if (data.id === selectedPlaceIdRef.current) {
        setRefreshKey((k) => k + 1);
      }
    };

    socket.on("place:updated", handlePlaceUpdated);
    return () => {
      socket.off("place:updated", handlePlaceUpdated);
    };
  }, []);

  // Place tap handler
  const handlePlacePress = useCallback((place) => {
    setSelectedPlaceId(place.id);
    setShowSheet(true);
  }, []);

  // Search select handler
  const handleSearchSelect = useCallback((place) => {
    setFocusPlace({ ...place, _ts: Date.now() });
    setSelectedPlaceId(place.id);
    setShowSheet(true);
  }, []);

  // Comment success handler
  const handleCommentSuccess = useCallback((data) => {
    const { comment, place } = data;
    const cat = comment.category.replace("_", " ");
    Alert.alert("AI analysed your comment", `${cat}, severity ${comment.severity}`);
    setRefreshKey((k) => k + 1);
  }, []);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId);
  const nearestHex = nearestStatus
    ? (nearestStatus.color === "green" ? "#22C55E" : nearestStatus.color === "yellow" ? "#EAB308" : "#EF4444")
    : "#9CA3AF";

  return (
    <View style={styles.container}>
      {/* Map (all rendering delegated to SafetyMap) */}
      <SafetyMap
        places={places}
        userLocation={userLocation}
        onPlacePress={handlePlacePress}
        focusPlace={focusPlace}
      />

      {/* Search bar */}
      <SearchBar onSelect={handleSearchSelect} />

      {/* Legend */}
      <Legend />

      {/* Bottom pill — nearest place safety */}
      {nearestStatus && (
        <TouchableOpacity
          style={[styles.pill, { borderColor: nearestHex }]}
          onPress={() => handlePlacePress(nearestStatus)}
          activeOpacity={0.8}
        >
          <View style={[styles.pillDot, { backgroundColor: nearestHex }]} />
          <Text style={styles.pillText} numberOfLines={1}>
            {nearestStatus.name} · {COLOR_LABEL[nearestStatus.color]}
          </Text>
        </TouchableOpacity>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>Server unreachable</Text>
          <TouchableOpacity onPress={fetchPlaces}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Banner for live updates */}
      <Banner
        message={banner.message}
        color={banner.color}
        visible={banner.visible}
        onHide={() => setBanner((b) => ({ ...b, visible: false }))}
      />

      {/* Place detail sheet */}
      <PlaceDetailSheet
        placeId={selectedPlaceId}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onAddComment={() => { setShowSheet(false); setShowComment(true); }}
        refreshKey={refreshKey}
      />

      {/* Comment modal */}
      <CommentModal
        visible={showComment}
        onClose={() => setShowComment(false)}
        placeId={selectedPlaceId}
        placeName={selectedPlace?.name || ""}
        userId={user.userId}
        onSuccess={handleCommentSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
  pill: {
    position: "absolute", bottom: 36, alignSelf: "center",
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#ffffffee", borderRadius: 24, borderWidth: 2,
    paddingHorizontal: 18, paddingVertical: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
    maxWidth: "80%",
  },
  pillDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  pillText: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  errorBar: {
    position: "absolute", bottom: 100, alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FEE2E2", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  errorText: { color: "#DC2626", fontSize: 13, fontWeight: "600" },
  retryText: { color: "#7C3AED", fontSize: 13, fontWeight: "700" },
});
