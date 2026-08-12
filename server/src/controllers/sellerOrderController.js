const SellerOrderService = require('../services/sellerOrderService');

/**
 * Express Controller handling Seller Multi-Tenant Order Fulfillment APIs.
 */

/**
 * GET /api/seller/orders
 * Fetch purchase orders / line items belonging ONLY to authenticated seller
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
 * Update line item fulfillment status (PENDING, ACCEPTED_BY_SELLER, READY_FOR_PICKUP, CANCELLED)
 */
const updateSellerOrderStatus = async (req, res) => {
  try {
    const sellerId = await SellerOrderService.resolveSellerId(req.user.id, req.user.profile_id);
    const orderItemId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status field is required.',
      });
    }

    const result = await SellerOrderService.updateSellerItemStatus(sellerId, orderItemId, status);

    return res.status(200).json({
      success: true,
      message: `Order item ${orderItemId} status updated to ${result.seller_status}.`,
      order_item: result,
    });
  } catch (error) {
    const statusCode = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update order status.',
    });
  }
};

module.exports = {
  getSellerOrders,
  updateSellerOrderStatus,
};
