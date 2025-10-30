import { io } from 'socket.io-client';
import { supabase } from '../supabaseClient'; // adjust path to your setup

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
  }

  async connect() {
    try {
      if (this.socket && this.connected) return this.socket;

      // Wait for Supabase session hydration
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const user = sessionData?.session?.user;
      if (!token || !user) {
        console.warn('[Socket] No Supabase session yet — delaying connection');
        // One-time listener to connect when session becomes available
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, newSession) => {
          if (newSession?.access_token && newSession.user) {
            try { sub?.subscription?.unsubscribe?.(); } catch (_) {}
            console.log('[Socket] Session restored, connecting socket...');
            this.connect();
          }
        });
        return null;
      }

      const userId = user.id;
      if (!userId) throw new Error('Supabase user ID missing.');

      // Compute base URL (strip trailing /api if present)
      const rawBase = import.meta.env.VITE_API_BASE_URL || '';
      const baseUrl = rawBase.replace(/\/?api\/?$/, '');

      // ⚡ Connect to backend Socket.IO server
      this.socket = io(baseUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        // Provide both query userId and auth token for compatibility
        query: { userId },
        auth: (cb) => cb({ token }),
      });

      // On connect
      this.socket.on('connect', () => {
        this.connected = true;
        console.log('[Socket] Connected:', this.socket.id);
        this.joinUserRoom(userId);
      });

      // On disconnect
      this.socket.on('disconnect', (reason) => {
        this.connected = false;
        console.warn('[Socket] Disconnected:', reason);
      });

      // Reconnect handler
      this.socket.io.on('reconnect', (attempt) => {
        console.log(`[Socket] Reconnected on attempt ${attempt}`);
        this.joinUserRoom(userId);
      });

      return this.socket;
    } catch (err) {
      console.error('[Socket] Connection error:', err);
      return null;
    }
  }

  joinUserRoom(userId) {
    if (!this.socket) return;
    // Backend primarily uses auth token to join user-specific room; this is a no-op hint
    this.socket.emit('join', userId);
    console.log(`[Socket] Joined personal room: ${userId}`);
  }

  joinConversation(conversationId) {
    if (!this.socket) return;
    this.socket.emit('join:conversation', conversationId);
    console.log(`[Socket] Joined conversation room: ${conversationId}`);
  }

  leaveConversation(conversationId) {
    if (!this.socket) return;
    this.socket.emit('leave:conversation', conversationId);
    console.log(`[Socket] Left conversation room: ${conversationId}`);
  }

  // Generic message send helper (emits both new and legacy events)
  async sendMessage(conversationId, text, orderRef = null) {
    if (!this.socket) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      conversationId,
      text,
      senderId: user?.id,
      orderRef,
      createdAt: new Date().toISOString(),
    };

    console.log('[Socket] Sending message:', payload);
    // New/event name used by some clients
    this.socket.emit('message:send', payload);
    // Backward/compat with backend 'sendMessage' handler
    this.socket.emit('sendMessage', payload, () => {});
  }

  // Register listener with cleanup support
  on(event, callback) {
    if (!this.socket) {
      console.warn(`[Socket] Tried to listen to "${event}" before connection`);
      return () => {};
    }

    this.socket.on(event, callback);
    this.listeners.set(callback, { event });
    console.log(`[Socket] Listening for event: ${event}`);

    return () => {
      this.socket.off(event, callback);
      this.listeners.delete(callback);
      console.log(`[Socket] Unsubscribed from event: ${event}`);
    };
  }

  emit(event, data) {
    if (!this.socket) return;
    this.socket.emit(event, data);
    console.log(`[Socket] Emitted event: ${event}`, data);
  }

  disconnect() {
    if (this.socket) {
      this.listeners.forEach(({ event }, callback) => {
        this.socket.off(event, callback);
      });
      this.listeners.clear();
      this.socket.disconnect();
      this.connected = false;
      console.log('[Socket] Disconnected and cleaned up.');
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
