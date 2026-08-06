/**
 * Admin Verification Middleware
 * Ensures the authenticated user has the 'ADMIN' role.
 * Must be executed after verifyToken middleware.
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Admin credentials required.',
    });
  }
  next();
};

module.exports = {
  verifyAdmin,
};
