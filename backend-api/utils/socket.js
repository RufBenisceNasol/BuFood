const { verifySupabaseToken } = require('../config/supabaseConfig');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let ioRef = null;

/**
 * Initialize socket.io server
 */
function setupSocket(server, options) {
  const { Server } = require('socket.io');
  ioRef = new Server(server, options);
  return ioRef;
}

/**
 * Authenticate socket connection using JWT token
 */
async function socketAuthFromToken(token) {
  let supaUser;
  try {
    supaUser = await verifySupabaseToken(token);
  } catch (e) {
    // Fallback to local JWT decode if Supabase is unreachable
    const decoded = jwt.decode(token);
    if (!decoded?.sub) throw new Error('Unauthorized');
    supaUser = { id: decoded.sub, user_metadata: decoded.user_metadata || {} };
  }
  
  const user = await User.findOne({ supabaseId: supaUser.id });
  if (!user) throw new Error('User not found');
  return user;
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
  socketAuthFromToken 
};
