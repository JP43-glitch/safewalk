// SafetyMap — all map rendering in one component
// Props: places, userLocation, onPlacePress, focusPlace
import React, { useRef, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Circle, Marker, UrlTile } from "react-native-maps";

const COLOR_HEX = { green: "#22C55E", yellow: "#EAB308", red: "#EF4444" };
const CHANDIGARH = { latitude: 30.7333, longitude: 76.7794, latitudeDelta: 0.08, longitudeDelta: 0.08 };
const CIRCLE_RADIUS = 150; // meters

export default function SafetyMap({ places, userLocation, onPlacePress, focusPlace }) {
  const mapRef = useRef(null);
  const [pulsingId, setPulsingId] = useState(null);

  // Animate to focused place (only when selecting/searching a place)
  useEffect(() => {
    if (focusPlace && focusPlace.lat && focusPlace.lng && !focusPlace.pulseOnly && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: focusPlace.lat,
          longitude: focusPlace.lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        600
      );
    }
  }, [focusPlace]);

  // Pulse animation for live updates
  useEffect(() => {
    if (pulsingId) {
      const timer = setTimeout(() => {
        setPulsingId(null);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [pulsingId]);

  // Expose pulse trigger via a method callable from parent
  useEffect(() => {
    if (focusPlace?.pulse) {
      setPulsingId(focusPlace.id);
    }
  }, [focusPlace]);

  const initialRegion = userLocation
    ? { latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : CHANDIGARH;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        toolbarEnabled={false}
      >
        <UrlTile
          urlTemplate="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          maximumZ={19}
          flipY={false}
          zIndex={-1}
        />
        {places.map((place) => {
          const hex = COLOR_HEX[place.color] || "#9CA3AF";
          const isPulsing = pulsingId === place.id;
          return (
            <React.Fragment key={place.id}>
              <Circle
                center={{ latitude: place.lat, longitude: place.lng }}
                radius={isPulsing ? 250 : CIRCLE_RADIUS}
                fillColor={hex + (isPulsing ? "60" : "30")}
                strokeColor={hex}
                strokeWidth={isPulsing ? 4 : 2}
              />
              <Marker
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                title={place.name}
                description={`Score: ${place.score} — ${place.color === "green" ? "Safe" : place.color === "yellow" ? "Caution" : "Unsafe"}`}
                onPress={() => onPlacePress(place)}
                pinColor={hex}
              />
            </React.Fragment>
          );
        })}
      </MapView>
    </View>
  );
}

// Helper to trigger pulse from parent
SafetyMap.triggerPulse = (setFocusPlace, place) => {
  setFocusPlace({ ...place, pulse: true, pulseOnly: true, _ts: Date.now() });
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
