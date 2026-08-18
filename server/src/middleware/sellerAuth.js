const supabase = require('../config/supabase');

/**
 * Seller Verification Middleware
 * Ensures the authenticated user has the 'SELLER' role and an APPROVED profile status.
 * Must be executed after verifyToken middleware.
 */
const verifySeller = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'SELLER') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Seller credentials required.',
      });
    }

    const { data: sellerProfile, error } = await supabase
      .from('seller_profiles')
      .select('id, current_status')
      .eq('user_id', req.user.id)
      .single();

    if (error || !sellerProfile || sellerProfile.current_status !== 'APPROVED') {
      return res.status(403).json({
        success: false,
        pendingApproval: true,
        message: 'Seller account pending admin approval. Access restricted until approved.',
      });
    }

    req.sellerProfile = sellerProfile;
    next();
  } catch (err) {
    console.error('Error in verifySeller middleware:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error verifying seller status.',
    });
  }
};

module.exports = {
  verifySeller,
};
