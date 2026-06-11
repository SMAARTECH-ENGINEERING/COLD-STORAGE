// Socket.IO client template. Do not connect yet.
import {SOCKET_URL} from '../config/env';
import {io} from 'socket.io-client';

let socket = null;

export const SocketService = {
  connect: () => {
    // TODO: enable when backend available
    // socket = io(SOCKET_URL);
    // socket.on('connect', () => console.log('socket connected'));
    return socket;
  },
  disconnect: () => {
    if (socket) socket.disconnect();
    socket = null;
  },
  subscribe: (event, cb) => {
    if (!socket) return;
    socket.on(event, cb);
  },
  emit: (event, payload) => {
    if (!socket) return;
    socket.emit(event, payload);
  }
};
