const User = require('../models/User');

/**
 * Map a Mongo User ObjectId to its Supabase user id (string), if available.
 * Fallback: returns null when not found.
 */
async function mapToSupabaseId(mongoId) {
  try {
    const user = await User.findById(mongoId).lean();
    return user?.supabaseId ? String(user.supabaseId) : null;
  } catch (_) {
    return null;
  }
}

module.exports = { mapToSupabaseId };
