const supabase = require('../config/supabase');

/**
 * Service to execute Account Merge of Guest Carts and Past Guest Orders into a newly logged in or registered Buyer Account.
 */
class AccountMergeService {
  /**
   * Merge guest cart items and past guest orders to a permanent buyer profile
   * @param {Object} params
   * @param {string} [params.guestId] - Unique guest session ID
   * @param {string} params.buyerProfileId - Permanent Buyer Profile UUID
   * @param {string} [params.email] - User email address
   * @param {string} [params.phone] - User phone number
   * @returns {Promise<Object>} Merge statistics and status summary
   */
  static async mergeGuestDataToAccount({ guestId, buyerProfileId, email, phone }) {
    if (!buyerProfileId) {
      throw new Error('buyerProfileId is required to perform account merge.');
    }

    let mergedCartItemsCount = 0;
    let mergedOrdersCount = 0;

    // ==========================================
    // 1. MERGE GUEST CART ITEMS TO BUYER PROFILE
    // ==========================================
    if (guestId) {
      const { data: guestCartItems, error: cartErr } = await supabase
        .from('cart_items')
        .select('*')
        .eq('guest_id', guestId);

      if (!cartErr && guestCartItems && guestCartItems.length > 0) {
        // Fetch existing buyer cart items
        const { data: buyerCartItems } = await supabase
          .from('cart_items')
          .select('*')
          .eq('buyer_profile_id', buyerProfileId);

        const buyerCartMap = new Map();
        (buyerCartItems || []).forEach(item => {
          buyerCartMap.set(item.product_id, item);
        });

        for (const guestItem of guestCartItems) {
          const existingBuyerItem = buyerCartMap.get(guestItem.product_id);

          if (existingBuyerItem) {
            // Product already exists in buyer's cart -> aggregate quantities and delete guest record
            const newQuantity = existingBuyerItem.quantity + guestItem.quantity;

            await supabase
              .from('cart_items')
              .update({ quantity: newQuantity })
              .eq('id', existingBuyerItem.id);

            await supabase
              .from('cart_items')
              .delete()
              .eq('id', guestItem.id);
            
            mergedCartItemsCount++;
          } else {
            // Re-link guest cart item directly to buyer profile
            await supabase
              .from('cart_items')
              .update({
                buyer_profile_id: buyerProfileId,
                guest_id: null,
              })
              .eq('id', guestItem.id);

            mergedCartItemsCount++;
          }
        }
      }
    }

    // ==========================================
    // 2. MERGE PAST GUEST ORDERS TO BUYER PROFILE
    // ==========================================
    // Match orders by guest_id OR matching guest_email OR matching guest_phone
    const orderConditions = [];

    if (guestId) {
      orderConditions.push(`guest_id.eq.${guestId}`);
    }
    if (email && email.trim()) {
      orderConditions.push(`guest_email.ilike.${email.trim()}`);
    }
    if (phone && phone.trim()) {
      orderConditions.push(`guest_phone.eq.${phone.trim()}`);
    }

    if (orderConditions.length > 0) {
      const { data: matchedOrders, error: orderFetchErr } = await supabase
        .from('orders')
        .select('id, buyer_profile_id, guest_id')
        .is('buyer_profile_id', null)
        .or(orderConditions.join(','));

      if (!orderFetchErr && matchedOrders && matchedOrders.length > 0) {
        const orderIdsToMerge = matchedOrders.map(o => o.id);

        const { data: updatedOrders, error: updateOrdersErr } = await supabase
          .from('orders')
          .update({
            buyer_profile_id: buyerProfileId,
            guest_id: null,
          })
          .in('id', orderIdsToMerge)
          .select('id');

        if (!updateOrdersErr && updatedOrders) {
          mergedOrdersCount = updatedOrders.length;
        }
      }
    }

    return {
      success: true,
      buyer_profile_id: buyerProfileId,
      merged_cart_items_count: mergedCartItemsCount,
      merged_orders_count: mergedOrdersCount,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = AccountMergeService;
