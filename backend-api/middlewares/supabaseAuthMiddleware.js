const { supabase } = require('../config/supabaseConfig');

/**
 * Middleware to authenticate requests using Supabase JWT tokens
 * This replaces the JWT-based authentication with Supabase authentication
 */
const authenticateWithSupabase = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if ((req.path || '').includes('/favorites')) {
        return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Please log in again to add favorites.' });
      }
      return res.status(401).json({ success: false, code: 'NO_TOKEN', message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    // Verify token with Supabase directly
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Unauthorized: Invalid token' });
    }

    // Attach Supabase user to request
    req.user = data.user;
    req.supabaseUser = data.user;
    
    next();
  } catch (err) {
    console.error('Supabase auth middleware error:', err);
    const msg = String(err?.message || '');
    const causeCode = err?.cause?.code || '';
    // Network/host resolution issues to Supabase should not be treated as TOKEN_EXPIRED
    if (msg.includes('fetch failed') || msg.includes('getaddrinfo') || causeCode === 'ENOTFOUND') {
      return res.status(503).json({ success: false, code: 'AUTH_UPSTREAM_UNREACHABLE', message: 'Authentication service temporarily unreachable' });
    }
    
    if (err.message && err.message.includes('expired')) {
      if ((req.path || '').includes('/favorites')) {
        return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Please log in again to add favorites.' });
      }
      return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Unauthorized: Token expired' });
    }
    
    if (err.message && err.message.includes('Invalid')) {
      return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Unauthorized: Invalid token' });
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
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) {
      req.user = data.user;
      req.supabaseUser = data.user;
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
