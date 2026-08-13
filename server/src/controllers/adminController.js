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
    const { status, rejection_reason } = req.body;
    const adminId = req.user ? req.user.id : null;

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

    // Build update payload with audit fields
    const updatePayload = {
      current_status: normalizedStatus,
      updated_at: new Date().toISOString(),
    };

    if (normalizedStatus === 'APPROVED') {
      updatePayload.approved_at = new Date().toISOString();
      if (adminId) updatePayload.approved_by = adminId;
      updatePayload.rejection_reason = null;
    } else if (normalizedStatus === 'REJECTED') {
      updatePayload.rejection_reason = rejection_reason || 'Application rejected by administration.';
    }

    // Update current_status in seller_profiles
    const { data: updatedSeller, error: updateErr } = await supabase
      .from('seller_profiles')
      .update(updatePayload)
      .eq('id', sellerId)
      .select(`
        id,
        user_id,
        business_name,
        business_address,
        tax_id,
        current_status,
        approved_at,
        approved_by,
        rejection_reason,
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

/**
 * GET /api/admin/buyers
 * Fetch all active buyer profiles with store/company details & order volume totals
 */
const getBuyersDirectory = async (req, res) => {
  try {
    const { data: buyers, error } = await supabase
      .from('buyer_profiles')
      .select(`
        id,
        user_id,
        full_name,
        company_name,
        store_name,
        contact_number,
        phone_number,
        billing_address,
        shipping_address,
        created_at,
        users (
          id,
          email,
          created_at
        ),
        orders (
          id,
          total_amount,
          status
        )
      `);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch buyers directory.',
        error: error.message,
      });
    }

    const formattedBuyers = (buyers || []).map((b) => {
      const orders = b.orders || [];
      const completedOrders = orders.filter((o) => o.status !== 'CANCELLED');
      const totalSpent = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

      return {
        id: b.id,
        user_id: b.user_id,
        full_name: b.full_name || 'Retail Buyer',
        company_name: b.company_name || b.store_name || b.full_name || 'Retail Store',
        store_name: b.store_name || b.company_name || 'Retail Store',
        email: b.users ? b.users.email : 'N/A',
        contact_number: b.contact_number || b.phone_number || 'N/A',
        location: b.billing_address || b.shipping_address || 'Pakistan',
        orders_placed: orders.length,
        total_volume: parseFloat(totalSpent.toFixed(2)),
        joined: b.created_at,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedBuyers.length,
      buyers: formattedBuyers,
    });
  } catch (error) {
    console.error('Error fetching buyers directory:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching buyers directory.',
      error: error.message,
    });
  }
};

module.exports = {
  getPendingSellers,
  updateSellerStatus,
  getBuyersDirectory,
};

