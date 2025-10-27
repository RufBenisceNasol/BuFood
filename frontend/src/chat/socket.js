import { io } from 'socket.io-client';
import { API_BASE_URL } from '../api';

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket(token) {
  if (socket) return socket;
  const base = (API_BASE_URL || '').replace(/\/api$/, '');
  socket = io(base || 'http://localhost:8000', {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
