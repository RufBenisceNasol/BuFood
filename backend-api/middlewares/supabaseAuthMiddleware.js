const { supabase } = require('../config/supabaseConfig');
const User = require('../models/userModel');

/**
 * Authenticate using Supabase access token only.
 * Verifies token via supabase.auth.getUser(token).
 */
const authenticateWithSupabase = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Supabase token' });
    }

    req.user = data.user;
    req.supabaseUser = data.user;
    return next();
  } catch (err) {
    console.error('Supabase auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Auth server error' });
  }
};

/**
 * Middleware to check user role
 * Works with both old JWT and new Supabase authentication
 */
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    const role = req.user?.role || req.user?.user_metadata?.role;
    if (!role || role !== requiredRole) {
      return res.status(403).json({ message: 'Access denied. Insufficient role.' });
    }
    next();
  };
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if no token is provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Supabase token' });
    }

    // Preserve raw Supabase user for consumers that need it
    req.supabaseUser = data.user;

    // Resolve MongoDB user by supabaseId so downstream controllers have _id/role
    try {
      const mongoUser = await User.findOne({ supabaseId: data.user.id }).lean();
      if (mongoUser) {
        // Attach mongo user as req.user to preserve existing controller expectations
        req.user = mongoUser;
      } else {
        // Fallback: expose minimal user with supabase id for routes that only need identity
        req.user = { _id: null, supabaseId: data.user.id, user_metadata: data.user.user_metadata };
      }
    } catch (_) {
      req.user = { _id: null, supabaseId: data.user.id, user_metadata: data.user.user_metadata };
    }

    return next();
  } catch (err) {
    // Silently fail and continue without authentication
    next();
  }
};

module.exports = {
  authenticateWithSupabase,
  checkRole,
  optionalAuth
};
