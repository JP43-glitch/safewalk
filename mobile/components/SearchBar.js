// SearchBar — floating search with debounced API calls and result dropdown
import React, { useState, useRef, useCallback } from "react";
import {
  View, TextInput, Text, TouchableOpacity, FlatList, StyleSheet,
} from "react-native";
import { searchPlaces } from "../api/client";

const COLOR_HEX = { green: "#22C55E", yellow: "#EAB308", red: "#EF4444" };

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef(null);

  const handleChange = useCallback((text) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!text.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const { data } = await searchPlaces(text.trim());
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);
  }, []);

  const handleSelect = (place) => {
    setQuery(place.name);
    setShowDropdown(false);
    onSelect(place);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputContainer}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Search a place..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleChange}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(""); setShowDropdown(false); setResults([]); }}>
            <Text style={styles.clear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {showDropdown && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item)}>
                <View style={[styles.dot, { backgroundColor: COLOR_HEX[item.color] || "#9CA3AF" }]} />
                <Text style={styles.resultText} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.score}>{item.score}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute", top: 54, left: 16, right: 16, zIndex: 100,
  },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  icon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#1F2937" },
  clear: { fontSize: 16, color: "#9CA3AF", paddingLeft: 8 },
  dropdown: {
    marginTop: 4, backgroundColor: "#fff", borderRadius: 12,
    maxHeight: 220, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  resultRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: "#F3F4F6",
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  resultText: { flex: 1, fontSize: 14, color: "#1F2937", fontWeight: "500" },
  score: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
});
