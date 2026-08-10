const supabase = require('../config/supabase');
const { sendSellerStatusAlert } = require('../services/emailService');

/**
 * GET /api/admin/sellers/pending
 * Fetch all sellers with current_status = 'PENDING'
 */
const getPendingSellers = async (req, res) => {
  try {
    // Fetch pending seller profiles and join with users email
    const { data: pendingSellers, error } = await supabase
      .from('seller_profiles')
      .select(`
        id,
        user_id,
        business_name,
        business_address,
        tax_id,
        current_status,
        created_at,
        updated_at,
        users (
          id,
          email,
          role,
          created_at
        )
      `)
      .eq('current_status', 'PENDING');

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch pending seller profiles.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: pendingSellers ? pendingSellers.length : 0,
      sellers: pendingSellers || [],
    });
  } catch (error) {
    console.error('Error fetching pending sellers:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching pending sellers.',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/admin/sellers/:id/status
 * Update seller_status to 'APPROVED' or 'REJECTED' and trigger email notification
 */
const updateSellerStatus = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const { status } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Target status must be APPROVED or REJECTED.',
      });
    }

    const normalizedStatus = status.toUpperCase();

    // Check if seller profile exists
    const { data: existingSeller, error: fetchErr } = await supabase
      .from('seller_profiles')
      .select(`
        id,
        user_id,
        business_name,
        current_status,
        users (
          id,
          email
        )
      `)
      .eq('id', sellerId)
      .single();

    if (fetchErr || !existingSeller) {
      return res.status(404).json({
        success: false,
        message: `Seller profile with ID ${sellerId} not found.`,
      });
    }

    // Update current_status in seller_profiles
    const { data: updatedSeller, error: updateErr } = await supabase
      .from('seller_profiles')
      .update({
        current_status: normalizedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sellerId)
      .select(`
        id,
        user_id,
        business_name,
        business_address,
        tax_id,
        current_status,
        updated_at,
        users (
          id,
          email
        )
      `)
      .single();

    if (updateErr) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update seller status.',
        error: updateErr.message,
      });
    }

    // Post-execution hook: immediately dispatch sendSellerStatusAlert notification
    const sellerEmail = existingSeller.users ? existingSeller.users.email : null;
    if (sellerEmail) {
      await sendSellerStatusAlert(sellerEmail, normalizedStatus);
    }

    return res.status(200).json({
      success: true,
      message: `Seller status updated successfully to ${normalizedStatus}. Notification dispatched.`,
      seller: updatedSeller,
    });
  } catch (error) {
    console.error('Error updating seller status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error updating seller status.',
      error: error.message,
    });
  }
};

module.exports = {
  getPendingSellers,
  updateSellerStatus,
};
