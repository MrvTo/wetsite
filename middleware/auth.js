const rateLimit = require('express-rate-limit');
const { auth, userHelpers } = require('../config/firebase');

// Verify Firebase ID token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user data from Firestore
    const user = await userHelpers.getUserById(decodedToken.uid);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request object
    req.user = user;
    req.uid = decodedToken.uid;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      req.user = null;
      req.uid = null;
      return next();
    }

    const decodedToken = await auth.verifyIdToken(token);
    const user = await userHelpers.getUserById(decodedToken.uid);
    
    req.user = user || null;
    req.uid = decodedToken.uid || null;
    next();
    
  } catch (error) {
    req.user = null;
    req.uid = null;
    next();
  }
};

// Require email verification
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Admin only access
const requireAdmin = requireRole(['admin']);

// Premium subscription check
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const { subscription } = req.user;
  const now = new Date();
  
  const isPremium = subscription && 
    (subscription.type === 'premium' || subscription.type === 'enterprise') &&
    subscription.endDate && 
    new Date(subscription.endDate) > now;

  if (!isPremium) {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED'
    });
  }

  next();
};

// Rate limiting for sensitive operations
const sensitiveOperationLimiter = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs: windowMs,
    max: maxAttempts,
    message: {
      success: false,
      message: 'Too many attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip + (req.uid || req.user?.uid || '');
    }
  });
};

// Generate custom token for client
const generateCustomToken = async (uid, additionalClaims = {}) => {
  try {
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    throw new Error(`Failed to generate custom token: ${error.message}`);
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireEmailVerification,
  requireRole,
  requireAdmin,
  requirePremium,
  sensitiveOperationLimiter,
  generateCustomToken
};