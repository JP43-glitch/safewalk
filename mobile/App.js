// SafeWalk — App entry point
import React, { useState } from "react";
import { StatusBar, View, StyleSheet } from "react-native";
import LoginScreen from "./screens/LoginScreen";
import MapScreen from "./screens/MapScreen";

export default function App() {
  const [user, setUser] = useState(null); // { userId, name }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      {user ? <MapScreen user={user} /> : <LoginScreen onLogin={setUser} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#F9FAFB",
  },
});
