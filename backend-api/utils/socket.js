const { verifySupabaseToken } = require('../config/supabaseConfig');
const jwt = require('jsonwebtoken');
const { sendMessageSocket } = require('../controllers/chatController');

let ioRef = null;

/**
 * Initialize socket.io server
 */
function setupSocket(server, options) {
  const { Server } = require('socket.io');
  ioRef = new Server(server, {
    ...options,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Handle new socket connections
  ioRef.on('connection', async (socket) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.log('❌ No token provided for socket connection');
      return socket.disconnect();
    }

    try {
      const supaUser = await verifySupabaseToken(token);
      socket.user = {
        id: supaUser.id,
        email: supaUser.email,
        role: supaUser.user_metadata?.role || 'customer',
      };

      // Join user-specific room for notifications & chat
      socket.join(String(supaUser.id));
      console.log(`✅ Socket connected: ${supaUser.email || supaUser.id} (${supaUser.id})`);

      // Real-time chat: persist and deliver messages
      socket.on('sendMessage', async (payload, cb) => {
        try {
          const msg = await sendMessageSocket(socket.user, payload, ioRef);
          if (typeof cb === 'function') cb({ ok: true, message: msg });
        } catch (err) {
          if (typeof cb === 'function') cb({ ok: false, error: err.message });
        }
      });

      // Legacy alias: send_message { toUserId, message, conversationId? }
      socket.on('send_message', async (data, cb) => {
        try {
          const normalized = {
            conversationId: data.conversationId,
            receiverId: data.receiverId || data.toUserId,
            text: data.text || data.message,
            attachments: data.attachments,
            orderRef: data.orderRef,
          };
          const msg = await sendMessageSocket(socket.user, normalized, ioRef);
          // Emit simplified event for legacy consumers
          ioRef.to(String(normalized.receiverId)).emit('new_message', msg);
          ioRef.to(String(socket.user.id)).emit('new_message', msg);
          if (typeof cb === 'function') cb({ ok: true, message: msg });
        } catch (err) {
          if (typeof cb === 'function') cb({ ok: false, error: err.message });
        }
      });
    } catch (err) {
      console.error('❌ Socket auth failed:', err.message);
      socket.disconnect();
    }
  });

  return ioRef;
}

/**
 * Emit an event to a specific user's room
 */
function emitToUser(userId, event, payload) {
  if (!ioRef) return;
  ioRef.to(String(userId)).emit(event, payload);
}

module.exports = {
  setupSocket,
  emitToUser,
};
