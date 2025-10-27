import { io } from 'socket.io-client';
import { getToken } from '../utils/tokenUtils';
import { API_BASE_URL } from '../api';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
    this.connectionPromise = null;
  }

  connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const token = getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Extract the base URL from API_BASE_URL (remove /api if present)
        const baseUrl = API_BASE_URL.replace(/\/api$/, '');
        
        this.socket = io(baseUrl, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
        });

        this.socket.on('connect', () => {
          console.log('Socket connected');
          this.connected = true;
          this.setupEventListeners();
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.connected = false;
          reject(error);
          this.connectionPromise = null;
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          this.connected = false;
          if (reason === 'io server disconnect') {
            // Reconnect if the server disconnects us
            this.socket.connect();
          }
        });

      } catch (error) {
        console.error('Socket initialization error:', error);
        reject(error);
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.connectionPromise = null;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Handle message received event
    this.socket.on('message:received', (data) => {
      this.emit('message:received', data);
    });

    // Handle conversation updated event
    this.socket.on('conversation:updated', (data) => {
      this.emit('conversation:updated', data);
    });
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  // Emit an event to all listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  // Send a message through the socket
  sendMessage(conversationId, text, orderRef = null) {
    if (!this.connected || !this.socket) {
      console.warn('Socket not connected, message not sent');
      return Promise.reject(new Error('Socket not connected'));
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('message:send', { conversationId, text, orderRef }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      });
    });
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (this.socket && this.connected) {
      this.socket.emit('conversation:join', { conversationId });
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (this.socket && this.connected) {
      this.socket.emit('conversation:leave', { conversationId });
    }
  }
}

// Create a singleton instance
export const socketService = new SocketService();

// Helper hook for using the socket service in React components
export function useSocket() {
  // This hook would be used in components to access the socket service
  // Implementation depends on your state management solution
  // For now, we'll just return the singleton instance
  return socketService;
}
