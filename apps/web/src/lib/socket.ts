import { io, Socket } from 'socket.io-client';
import { config } from '@/config';

let socket: Socket | null = null;

/**
 * Create (or reuse) a singleton Socket.IO connection.
 *
 * - In production: expects VITE_API_URL to be full HTTP URL, e.g. http://api.example.com/api
 * - In development with Vite proxy (/api → http://localhost:4000):
 *   we infer the API origin from current hostname and optional VITE_API_PORT (default 4000).
 */
export function getSocket(token: string | null): Socket | null {
  if (!token) return null;

  if (!socket || !socket.connected) {
    let apiBaseUrl = config.api.baseURL;

    // If baseURL is relative (e.g. '/api'), build full API URL using current host + dev API port
    if (!apiBaseUrl.startsWith('http')) {
      const protocol = window.location.protocol; // http: or https:
      const host = window.location.hostname;
      const port = import.meta.env.VITE_API_PORT || '4000';
      apiBaseUrl = `${protocol}//${host}:${port}/api`;
    }

    // Strip trailing /api to get pure origin for Socket.IO server
    const socketOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

    socket = io(socketOrigin, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
      withCredentials: true,
    });
  }

  return socket;
}

