import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { SOCKET_URL, TOKEN_KEYS } from '../config/env';

let socket = null;

export const SocketService = {
  connect: async () => {
    if (socket?.connected) return socket;

    const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => console.log('[Socket] connected'));
    socket.on('disconnect', (reason) => console.log('[Socket] disconnected:', reason));
    socket.on('connect_error', (err) => console.warn('[Socket] error:', err.message));

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  subscribe: (event, cb) => {
    if (!socket) return;
    socket.on(event, cb);
    return () => socket?.off(event, cb);
  },

  emit: (event, payload) => {
    if (socket?.connected) socket.emit(event, payload);
  },

  isConnected: () => socket?.connected ?? false,
};
