const SellerOrderService = require('../services/sellerOrderService');

/**
 * Express Controller handling Seller Multi-Tenant Order Fulfillment & Profitability APIs.
 */

/**
 * GET /api/seller/orders
 * Fetch purchase orders / line items formatted directly for Sharaf's OrdersTab.jsx
 */
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = await SellerOrderService.resolveSellerId(req.user.id, req.user.profile_id);
    const orders = await SellerOrderService.getOrdersForSeller(sellerId);

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch seller orders.',
    });
  }
};

/**
 * PATCH /api/seller/orders/:id/status
 * Update line item / order status ("Pending Verification", "Approved", "Shipped", "Cancelled")
 */
const updateSellerOrderStatus = async (req, res) => {
  try {
    const sellerId = await SellerOrderService.resolveSellerId(req.user.id, req.user.profile_id);
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status field is required.',
      });
    }

    const result = await SellerOrderService.updateSellerOrderStatus(sellerId, orderId, status);

    return res.status(200).json({
      success: true,
      message: `Order ${orderId} status updated to ${result.status}.`,
      order: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status.',
    });
  }
};

/**
 * PATCH /api/seller/orders/:id/profitability
 * Update order profitability values (cogs, fees, shipping, returns)
 */
const updateOrderProfitability = async (req, res) => {
  try {
    const sellerId = await SellerOrderService.resolveSellerId(req.user.id, req.user.profile_id);
    const orderId = req.params.id;

    const result = await SellerOrderService.updateOrderProfitability(sellerId, orderId, req.body);

    return res.status(200).json({
      success: true,
      message: `Order ${orderId} profitability values updated successfully.`,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order profitability.',
    });
  }
};

/**
 * POST /api/seller/orders/apply-defaults
 * Apply flat PKR default cost, fee, and shipping rules to all seller's active orders
 */
const applyDefaultRates = async (req, res) => {
  try {
    const sellerId = await SellerOrderService.resolveSellerId(req.user.id, req.user.profile_id);
    const { defaultCogs, defaultFees, defaultShipping } = req.body;

    const result = await SellerOrderService.applyDefaultRates(sellerId, {
      defaultCogs,
      defaultFees,
      defaultShipping,
    });

    return res.status(200).json({
      success: true,
      message: 'Flat cost rules applied to all active orders.',
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply default cost rules.',
    });
  }
};

module.exports = {
  getSellerOrders,
  updateSellerOrderStatus,
  updateOrderProfitability,
  applyDefaultRates,
};
