import { io, type Socket } from "socket.io-client";
import { getStoredToken } from "@/lib/api";
import { getGuardianToken } from "@/lib/guardianApi";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? "/";

let userSocket: Socket | null = null;
let guardianSocket: Socket | null = null;

/**
 * Socket authenticated as the logged-in SafeHer AI user. Used to push
 * live location pings and receive SOS acknowledgements.
 */
export function getUserSocket(): Socket | null {
  const token = getStoredToken();
  if (!token) return null;

  if (userSocket && userSocket.connected) return userSocket;

  userSocket?.disconnect();
  userSocket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return userSocket;
}

/**
 * Socket authenticated as a Guardian. Used to watch a connected user's
 * live location and receive emergency alerts in real time.
 */
export function getGuardianSocket(): Socket | null {
  const token = getGuardianToken();
  if (!token) return null;

  if (guardianSocket && guardianSocket.connected) return guardianSocket;

  guardianSocket?.disconnect();
  guardianSocket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  return guardianSocket;
}

export function disconnectUserSocket() {
  userSocket?.disconnect();
  userSocket = null;
}

export function disconnectGuardianSocket() {
  guardianSocket?.disconnect();
  guardianSocket = null;
}
