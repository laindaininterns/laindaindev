const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET } = require('./auth');

/**
 * Middleware to support dual Authenticated User & Guest Session Context
 * 1. Verifies JWT token if present -> req.user set, req.isGuest = false
 * 2. If unauthenticated -> resolves x-guest-id header/body or auto-generates a new guest ID -> req.isGuest = true, req.guestId set
 */
const resolveGuestOrUser = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // 1. Try Authenticated User Context via JWT Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.isGuest = false;
      req.guestId = req.headers['x-guest-id'] || req.headers['x-guest-token'] || null;
      return next();
    } catch (err) {
      // Invalid JWT -> fall through to guest resolution
    }
  }

  // 2. Resolve or Initialize Guest Context
  req.user = null;
  req.isGuest = true;

  let guestId = 
    req.headers['x-guest-id'] || 
    req.headers['x-guest-token'] || 
    req.query.guest_id || 
    (req.body && req.body.guest_id);

  if (!guestId || typeof guestId !== 'string' || !guestId.trim()) {
    guestId = `guest_${crypto.randomUUID()}`;
  } else {
    guestId = guestId.trim();
  }

  req.guestId = guestId;

  // Expose guest ID back to client via header
  res.setHeader('x-guest-id', guestId);
  res.setHeader('Access-Control-Expose-Headers', 'x-guest-id');

  next();
};

module.exports = {
  resolveGuestOrUser,
};
