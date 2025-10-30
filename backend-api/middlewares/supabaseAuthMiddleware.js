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
const checkRole = (requiredRole) => (req, res, next) => {
  const supaMetaRole = req.supabaseUser?.user_metadata?.role;
  const userMetaRole = req.user?.user_metadata?.role;
  const mongoRole = req.user?.role;
  const effectiveRole = supaMetaRole || mongoRole || userMetaRole;
  if (!effectiveRole || effectiveRole !== requiredRole) {
    console.warn(`[Auth] Role mismatch. Expected: ${requiredRole}, Got: ${effectiveRole}`);
    return res.status(403).json({ message: 'Access denied. Insufficient role.' });
  }
  next();
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
      const supaId = data.user.id;
      const email = data.user.email;
      const meta = data.user.user_metadata || {};
      const role = meta.role || 'Customer';
      const name = meta.name || meta.full_name || (email ? email.split('@')[0] : 'User');
      // 1) Prefer match by supabaseId
      let mongoUser = await User.findOne({ supabaseId: supaId });
      // 2) If not found, try to link by email and set supabaseId
      if (!mongoUser && email) {
        mongoUser = await User.findOne({ email });
        if (mongoUser && !mongoUser.supabaseId) {
          mongoUser.supabaseId = supaId;
          // prefer existing name/contact/role; only set if absent
          if (!mongoUser.name) mongoUser.name = name;
          if (!mongoUser.role) mongoUser.role = role;
          await mongoUser.save();
        }
      }
      // 3) If still not found, auto-provision minimal user (ensure required fields)
      if (!mongoUser) {
        mongoUser = new User({
          supabaseId: supaId,
          email,
          name,
          role,
          contactNumber: '+00000000000', // satisfy required field; user can update later
          authMethod: 'supabase',
          isVerified: true,
        });
        await mongoUser.save();
      }
      // Attach mongo user as req.user to preserve existing controller expectations
      req.user = mongoUser.toObject ? mongoUser.toObject() : mongoUser;
    } catch (e) {
      // Fallback: expose minimal user with supabase id
      req.user = { _id: null, supabaseId: data.user.id, user_metadata: data.user.user_metadata };
    }

    return next();
  } catch (err) {
    // Fail closed: if auth processing throws, return Unauthorized
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

module.exports = {
  authenticateWithSupabase,
  checkRole,
  optionalAuth
};
