const supabase = require('../config/supabase');
const NotificationService = require('./notificationService');

/**
 * Service to handle Admin Global Logistics & Marketplace Order Controls.
 */
class AdminLogisticsService {
  /**
   * Fetch all marketplace orders with comprehensive buyer, seller, and line item details
   * @param {Object} [params]
   * @param {string} [params.status] - Optional global status filter
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @returns {Promise<Object>} Orders list & count
   */
  static async getAllOrdersAdmin({ status, page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('orders')
      .select(`
        id,
        buyer_profile_id,
        guest_id,
        guest_email,
        guest_phone,
        total_amount,
        status,
        shipping_address,
        created_at,
        updated_at,
        buyer_profiles (
          id,
          full_name,
          phone_number,
          users (
            email
          )
        ),
        order_items (
          id,
          product_id,
          seller_id,
          quantity,
          price_at_purchase,
          seller_status,
          created_at,
          products (
            id,
            title,
            images
          ),
          seller_profiles (
            id,
            business_name
          )
        )
      `, { count: 'exact' });

    if (status && status.trim()) {
      query = query.eq('status', status.trim().toUpperCase());
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch marketplace orders: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limitNum);

    const formattedOrders = (data || []).map(order => ({
      order_id: order.id,
      buyer_profile_id: order.buyer_profile_id,
      guest_id: order.guest_id,
      customer_email: order.guest_email || (order.buyer_profiles && order.buyer_profiles.users ? order.buyer_profiles.users.email : 'N/A'),
      customer_phone: order.guest_phone || (order.buyer_profiles ? order.buyer_profiles.phone_number : 'N/A'),
      total_amount: parseFloat(order.total_amount),
      global_status: order.status,
      shipping_address: order.shipping_address,
      items_count: order.order_items ? order.order_items.length : 0,
      order_items: (order.order_items || []).map(item => ({
        order_item_id: item.id,
        product_id: item.product_id,
        product_title: item.products ? item.products.title : 'Product',
        product_image: item.products && item.products.images && item.products.images.length > 0 ? item.products.images[0] : null,
        seller_id: item.seller_id,
        seller_name: item.seller_profiles ? item.seller_profiles.business_name : 'Seller',
        quantity: item.quantity,
        price_at_purchase: parseFloat(item.price_at_purchase),
        seller_status: item.seller_status || 'PENDING',
      })),
      created_at: order.created_at,
      updated_at: order.updated_at,
    }));

    return {
      orders: formattedOrders,
      count: totalCount,
      page: pageNum,
      limit: limitNum,
      total_pages: totalPages,
    };
  }

  /**
   * Admin global override of order delivery status
   * @param {string} orderId 
   * @param {string} globalStatus - ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')
   * @returns {Promise<Object>} Updated order record
   */
  static async updateOrderGlobalStatusAdmin(orderId, globalStatus) {
    if (!orderId || !globalStatus) {
      throw new Error('Order ID and globalStatus are required.');
    }

    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const normalizedStatus = globalStatus.toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      throw new Error(`Invalid status. Allowed values: ${validStatuses.join(', ')}.`);
    }

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*, buyer_profiles(users(email))')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr || !order) {
      throw new Error('Order not found.');
    }

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update({ status: normalizedStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`Failed to update order status: ${updateErr.message}`);
    }

    // Trigger transactional Resend email alerts to buyer upon status change
    const recipientEmail = order.guest_email || (order.buyer_profiles && order.buyer_profiles.users ? order.buyer_profiles.users.email : null);

    if (recipientEmail) {
      if (['SHIPPED', 'PROCESSING'].includes(normalizedStatus)) {
        NotificationService.sendShippingUpdateNotification(recipientEmail, orderId, normalizedStatus).catch(err => {
          console.error('[Notification Non-blocking Error]', err.message);
        });
      } else if (normalizedStatus === 'DELIVERED') {
        NotificationService.sendDeliveryCompletionNotification(recipientEmail, orderId).catch(err => {
          console.error('[Notification Non-blocking Error]', err.message);
        });
      }
    }

    return updatedOrder;
  }
}

module.exports = AdminLogisticsService;
