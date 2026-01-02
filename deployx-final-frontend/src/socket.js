import { io } from "socket.io-client";
import { env } from "./env.js";

// Connect to your backend server.
// Socket.IO automatically appends /socket.io/ to the URL
// If socketURL is https://rajat-deployx.xyz, it connects to https://rajat-deployx.xyz/socket.io/
const socket = io(env.socketURL, {
  path: "/socket.io/",
  transports: ["websocket", "polling"],
});

// Store the current project ID and callback
let currentProjectId = null;
let currentCallback = null;

// Set up connection listeners immediately
socket.on("connect", () => {
  console.log(`✅ Connected to server with socket ID: ${socket.id}`);

  // If we have a project ID, join the room immediately
  if (currentProjectId) {
    joinProjectRoom(currentProjectId);
  }
});

// Handle disconnection
socket.on("disconnect", () => {
  console.log("🔌 Disconnected from server.");
});

// Handle connection errors
socket.on("connect_error", (err) => {
  console.error("Connection Error:", err.message);
});

// Handle incoming logs
socket.on("log", (logMessage) => {
  console.log("📄 New Log:", logMessage);
  if (currentCallback) {
    currentCallback(logMessage);
  }
});

// Helper function to join project room
function joinProjectRoom(projectId) {
  console.log(`Joining room for project: ${projectId}`);
  socket.emit("joinRoom", projectId);
  console.log(`🚀 Emitted 'joinRoom' for project: ${projectId}`);
}

// This function handles joining a room and listening for logs
export function listenToLogs(projectId, onLogReceived) {
  currentProjectId = projectId;
  currentCallback = onLogReceived;

  console.log(`Setting up listeners for project: ${projectId}`);

  // If already connected, join room immediately
  if (socket.connected) {
    joinProjectRoom(projectId);
  }
  // If not connected, the connect listener will handle joining when ready
}
