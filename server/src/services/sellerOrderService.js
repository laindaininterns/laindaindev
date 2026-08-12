const supabase = require('../config/supabase');

/**
 * Service to handle Seller Multi-Tenant Order Fulfillment & Line Item Management.
 */
class SellerOrderService {
  /**
   * Helper to resolve seller_profile_id from user_id or token profile_id
   * @param {string} userId 
   * @param {string} [profileIdFromToken] 
   * @returns {Promise<string>} seller_profile_id
   */
  static async resolveSellerId(userId, profileIdFromToken) {
    if (profileIdFromToken) return profileIdFromToken;

    const { data, error } = await supabase
      .from('seller_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Seller profile not found for authenticated user.');
    }

    return data.id;
  }

  /**
   * Fetch purchase orders / order line items belonging ONLY to authenticated seller (Multi-Tenant Isolated)
   * @param {string} sellerId 
   * @returns {Promise<Array>} List of seller line items with parent order metadata
   */
  static async getOrdersForSeller(sellerId) {
    if (!sellerId) throw new Error('Seller ID is required.');

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        product_id,
        seller_id,
        quantity,
        price_at_purchase,
        seller_status,
        created_at,
        products (
          id,
          title,
          images,
          stock_quantity
        ),
        orders (
          id,
          buyer_profile_id,
          guest_id,
          guest_email,
          guest_phone,
          total_amount,
          status,
          shipping_address,
          created_at,
          buyer_profiles (
            users (
              email
            )
          )
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch seller orders: ${error.message}`);
    }

    return (data || []).map(item => ({
      order_item_id: item.id,
      order_id: item.order_id,
      seller_id: item.seller_id,
      product_id: item.product_id,
      product_title: item.products ? item.products.title : 'Product',
      product_image: item.products && item.products.images && item.products.images.length > 0 ? item.products.images[0] : null,
      quantity: item.quantity,
      price_at_purchase: parseFloat(item.price_at_purchase),
      item_subtotal: parseFloat((parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)),
      seller_status: item.seller_status || 'PENDING',
      created_at: item.created_at,
      parent_order: item.orders ? {
        order_id: item.orders.id,
        global_status: item.orders.status,
        shipping_address: item.orders.shipping_address,
        order_total: parseFloat(item.orders.total_amount),
        customer_email: item.orders.guest_email || (item.orders.buyer_profiles && item.orders.buyer_profiles.users ? item.orders.buyer_profiles.users.email : 'N/A'),
        customer_phone: item.orders.guest_phone || null,
        created_at: item.orders.created_at,
      } : null,
    }));
  }

  /**
   * Update line item fulfillment status for authenticated seller
   * @param {string} sellerId 
   * @param {string} orderItemId 
   * @param {string} sellerStatus - ('PENDING', 'ACCEPTED_BY_SELLER', 'READY_FOR_PICKUP', 'CANCELLED')
   * @returns {Promise<Object>} Updated line item & updated parent order status
   */
  static async updateSellerItemStatus(sellerId, orderItemId, sellerStatus) {
    if (!sellerId || !orderItemId || !sellerStatus) {
      throw new Error('sellerId, orderItemId, and sellerStatus are required.');
    }

    const validStatuses = ['PENDING', 'ACCEPTED_BY_SELLER', 'READY_FOR_PICKUP', 'CANCELLED'];
    const normalizedStatus = sellerStatus.toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      throw new Error(`Invalid status. Allowed values: ${validStatuses.join(', ')}.`);
    }

    // Verify seller ownership of line item
    const { data: item, error: fetchErr } = await supabase
      .from('order_items')
      .select('id, seller_id, order_id, seller_status')
      .eq('id', orderItemId)
      .maybeSingle();

    if (fetchErr || !item) {
      throw new Error('Order line item not found.');
    }

    if (item.seller_id !== sellerId) {
      throw new Error('Forbidden: You do not own this order line item.');
    }

    // Update line item status
    const { data: updatedItem, error: updateErr } = await supabase
      .from('order_items')
      .update({ seller_status: normalizedStatus })
      .eq('id', orderItemId)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`Failed to update item status: ${updateErr.message}`);
    }

    // Evaluate parent order status shift
    const orderId = item.order_id;
    const { data: allOrderItems } = await supabase
      .from('order_items')
      .select('seller_status')
      .eq('order_id', orderId);

    let updatedParentStatus = null;
    if (allOrderItems && allOrderItems.length > 0) {
      const allAcceptedOrReady = allOrderItems.every(i => 
        ['ACCEPTED_BY_SELLER', 'READY_FOR_PICKUP'].includes(i.seller_status)
      );

      if (allAcceptedOrReady) {
        const { data: parentOrder } = await supabase
          .from('orders')
          .update({ status: 'PROCESSING' })
          .eq('id', orderId)
          .select('status')
          .single();

        if (parentOrder) {
          updatedParentStatus = parentOrder.status;
        }
      }
    }

    return {
      order_item_id: updatedItem.id,
      order_id: updatedItem.order_id,
      seller_status: updatedItem.seller_status,
      parent_order_global_status: updatedParentStatus,
      updated_at: new Date().toISOString(),
    };
  }
}

module.exports = SellerOrderService;
