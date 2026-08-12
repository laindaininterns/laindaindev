const AdminLogisticsService = require('../services/adminLogisticsService');

/**
 * Express Controller handling Admin Global Order Logistics APIs.
 */

/**
 * GET /api/admin/orders
 * Fetch all marketplace orders across buyers and sellers
 */
const getAdminOrders = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const result = await AdminLogisticsService.getAllOrdersAdmin({ status, page, limit });

    return res.status(200).json({
      success: true,
      count: result.orders.length,
      total_count: result.count,
      page: result.page,
      limit: result.limit,
      total_pages: result.total_pages,
      orders: result.orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin orders.',
    });
  }
};

/**
 * PATCH /api/admin/orders/:id/status
 * Global admin status override (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
 */
const updateAdminOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status field is required.',
      });
    }

    const updatedOrder = await AdminLogisticsService.updateOrderGlobalStatusAdmin(orderId, status);

    return res.status(200).json({
      success: true,
      message: `Global status for Order ${orderId} updated to ${updatedOrder.status}.`,
      order: updatedOrder,
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update global order status.',
    });
  }
};

module.exports = {
  getAdminOrders,
  updateAdminOrderStatus,
};
