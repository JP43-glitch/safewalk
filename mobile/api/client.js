// API client — axios instance + socket.io helper
import axios from "axios";
import { io } from "socket.io-client";
import { API_URL } from "../config";

// Axios instance with base URL and timeout
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Socket.IO singleton
let socket = null;

export function connectSocket() {
  if (socket) return socket;
  socket = io(API_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });
  socket.on("connect", () => console.log("[socket] connected:", socket.id));
  socket.on("disconnect", () => console.log("[socket] disconnected"));
  return socket;
}

export function getSocket() {
  return socket;
}

// API methods
export const authDemo = (name) => api.post("/auth/demo", { name });
export const getPlaces = () => api.get("/places");
export const searchPlaces = (q) => api.get("/places/search", { params: { q } });
export const getPlace = (id) => api.get(`/places/${id}`);
export const addComment = (placeId, userId, text, timeOfDay) =>
  api.post(`/places/${placeId}/comments`, { userId, text, timeOfDay });
export const healthCheck = () => api.get("/health");

export default api;
