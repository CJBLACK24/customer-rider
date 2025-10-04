// client/socket/socket.ts
import { API_URL } from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function createSocket(token: string) {
  // Use your dynamic API_URL so IP changes are handled automatically.
  // Force pure WebSocket for React Native (avoids HTTP polling issues).
  return io(API_URL, {
    transports: ["websocket"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 6000, // ⏱️ fail fast on handshake (no 30s wait)
    forceNew: true,
  });
}

export async function connectSocket(): Promise<Socket> {
  const token = await AsyncStorage.getItem("token");
  if (!token) {
    throw new Error("no token found, User must login first");
  }

  // If already connected, reuse it.
  if (socket?.connected) return socket;

  // Ensure any stale instance is cleaned up before creating a new one.
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = createSocket(token);

  // Helpful logs (won't affect your app flow)
  socket.on("connect_error", (err) => {
    console.log("Socket connect_error:", err?.message || err);
  });
  socket.on("error", (err) => {
    console.log("Socket error:", err);
  });
  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  // Wait for connect OR fail quickly with a clear error.
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error("Socket connection timed out. Check API_URL / same LAN."));
    }, 6500);

    socket!.once("connect", () => {
      clearTimeout(t);
      console.log("Socket connected", socket?.id);
      resolve();
    });

    socket!.once("connect_error", (err) => {
      clearTimeout(t);
      reject(err instanceof Error ? err : new Error("Socket connect error"));
    });
  });

  return socket!;
}

export function getSocket(): Socket | null {
  return socket && socket.connected ? socket : null;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
