const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabaseConfig');

/**
 * Authenticate using backend-issued JWT first (JWT_SECRET),
 * falling back to Supabase token verification if needed.
 */
const authenticateWithSupabase = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, code: 'NO_TOKEN', message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Try backend JWT verification first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user || decoded;
      req.userId = decoded.user?.id || decoded.id;
      return next();
    } catch (jwtErr) {
      // Fallback: try Supabase token verification
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) throw error;
        req.user = data.user;
        req.supabaseUser = data.user;
        return next();
      } catch (e) {
        return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Unauthorized: Invalid or expired token' });
      }
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    if (err.message && err.message.includes('expired')) {
      return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Token expired, please log in again' });
    }
    res.status(500).json({ success: false, code: 'AUTH_SERVER_ERROR', message: 'Internal server error during authentication' });
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
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user || decoded;
      req.userId = decoded.user?.id || decoded.id;
    } catch (e) {
      // fallback to Supabase token if not a backend JWT
      const { data } = await supabase.auth.getUser(token);
      if (data?.user) {
        req.user = data.user;
        req.supabaseUser = data.user;
      }
    }

    next();
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
