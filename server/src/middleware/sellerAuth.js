/**
 * Seller Verification Middleware
 * Ensures the authenticated user has the 'SELLER' role.
 * Must be executed after verifyToken middleware.
 */
const verifySeller = (req, res, next) => {
  if (!req.user || req.user.role !== 'SELLER') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Seller credentials required.',
    });
  }
  next();
};

module.exports = {
  verifySeller,
};
