import { NativeModules } from "react-native";

// SafeWalk API URL
// Auto-detect the machine's LAN IP from the Expo / Metro development server URL
const getApiUrl = () => {
  try {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      // e.g. "http://192.168.1.10:8081/index.bundle?platform=android..."
      const host = scriptURL.split("://")[1]?.split("/")[0]?.split(":")[0];
      if (host && host !== "localhost" && host !== "127.0.0.1") {
        return `http://${host}:3000`;
      }
    }
  } catch (e) {
    // fallback if anything goes wrong
  }
  // Fallback default
  return "http://10.222.74.163:3000";
};

export const API_URL = getApiUrl();
