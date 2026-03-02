import { io, type Socket } from "socket.io-client";

type EventCallback = (...args: unknown[]) => void;

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_DELAY_MS = 1000;

/**
 * Returns the shared Socket.io instance, creating it if needed.
 * Uses cookie-based auth (withCredentials: true).
 */
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(window.location.origin, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: BASE_DELAY_MS,
    reconnectionDelayMax: BASE_DELAY_MS * Math.pow(2, 4), // 16s max
  });

  socket.on("connect", () => {
    reconnectAttempts = 0;
  });

  socket.on("disconnect", () => {
    reconnectAttempts += 1;
  });

  return socket;
}

/** Emit an event with typed payload. */
export function emitEvent(event: string, payload: Record<string, unknown>): void {
  const s = getSocket();
  if (s.connected) {
    s.emit(event, payload);
  }
}

/** Subscribe to a socket event. Returns an unsubscribe function. */
export function onEvent(event: string, callback: EventCallback): () => void {
  const s = getSocket();
  s.on(event, callback);
  return () => {
    s.off(event, callback);
  };
}

/** Disconnect and discard the socket instance. */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
}

/** Check if socket is currently connected. */
export function isConnected(): boolean {
  return socket?.connected ?? false;
}
