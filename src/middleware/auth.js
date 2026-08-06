const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lain-dain-jwt-secret-key-change-in-prod';

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header (Bearer <token>)
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
};

module.exports = {
  verifyToken,
  JWT_SECRET,
};
