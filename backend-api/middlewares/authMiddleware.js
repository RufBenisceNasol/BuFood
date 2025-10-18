// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.set('WWW-Authenticate', 'Bearer realm="api", error="invalid_request", error_description="No token provided"');
      return res.status(401).json({ success: false, code: 'NO_TOKEN', message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ success: false, code: 'SERVER_MISCONFIG', message: 'Internal server configuration error' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.set('WWW-Authenticate', 'Bearer realm="api", error="invalid_token", error_description="User not found"');
      return res.status(401).json({ success: false, code: 'USER_NOT_FOUND', message: 'Unauthorized: User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      res.set('WWW-Authenticate', 'Bearer realm="api", error="invalid_token", error_description="Invalid token"');
      return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Unauthorized: Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      res.set('WWW-Authenticate', 'Bearer realm="api", error="invalid_token", error_description="Token expired"');
      return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Unauthorized: Token expired' });
    }
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, code: 'AUTH_ERROR', message: 'Internal server error during authentication' });
  }
};

const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'Access denied. Insufficient role.' });
    }
    next();
  };
};

module.exports = {
  authenticate,
  checkRole,
};
