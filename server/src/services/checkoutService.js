const supabase = require('../config/supabase');
const CartService = require('./cartService');
const BuyerProfileService = require('./buyerProfileService');

/**
 * Service to execute Multivendor Checkout transactions for Authenticated Buyers and Guests.
 */
class CheckoutService {
  /**
   * Transactional checkout logic for authenticated user session OR guest session:
   * 1. Fetch all current cart_items for buyer/guest
   * 2. Validate input and calculate aggregate total_amount
   * 3. Create parent record in `orders` table (with buyer_profile_id or guest_id/guest_email/guest_phone)
   * 4. Map & bulk-insert items into `order_items` (capturing static price_at_purchase & seller_id)
   * 5. Atomically clear user/guest cart_items
   * 6. Return generated order_id & breakdown summary
   * 
   * @param {Object} context - { userId, buyerProfileId, guestId, isGuest }
   * @param {Object} [checkoutPayload] - { guest_email, guest_phone, shipping_address }
   * @returns {Promise<Object>} Created Order result
   */
  static async processCheckout(context, { guest_email, guest_phone, shipping_address } = {}) {
    const { userId, isGuest, guestId } = context;
    let buyerProfileId = context.buyerProfileId;

    let finalShippingAddress = shipping_address;
    let finalGuestEmail = guest_email || null;
    let finalGuestPhone = guest_phone || null;

    if (!isGuest && userId) {
      // Authenticated User Checkout
      let profile = await BuyerProfileService.getProfileByUserId(userId);
      if (!profile) {
        profile = await BuyerProfileService.createProfile(userId, { shipping_address });
      }
      buyerProfileId = profile.id;
      finalShippingAddress = shipping_address || profile.shipping_address || profile.billing_address || 'Standard Shipping Address';
      finalGuestEmail = profile.users ? profile.users.email : null;
      finalGuestPhone = profile.phone_number || profile.contact_number || null;
    } else {
      // Guest Checkout Validation
      if (!guestId) {
        throw new Error('Guest session ID is required for guest checkout.');
      }
      if (!finalGuestEmail && !finalGuestPhone) {
        const err = new Error('Guest checkout requires an email address or contact phone number.');
        err.statusCode = 400;
        throw err;
      }
      if (!finalShippingAddress || !finalShippingAddress.trim()) {
        const err = new Error('Shipping address is required for guest checkout.');
        err.statusCode = 400;
        throw err;
      }
    }

    // Step a: Fetch current cart items for the buyer profile or guest session
    const cartItems = await CartService.getCartItems({ buyerProfileId, guestId });

    if (!cartItems || cartItems.length === 0) {
      const err = new Error('Cannot checkout with an empty cart.');
      err.statusCode = 400;
      throw err;
    }

    // Step b: Calculate aggregate total_amount & validate items
    let aggregateTotal = 0;
    const orderItemsToInsert = [];
    const sellerIds = new Set();

    for (const item of cartItems) {
      if (!item.product) {
        throw new Error(`Cart item ${item.cart_item_id} references missing product.`);
      }

      const unitPrice = parseFloat(item.product.price);
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw new Error(`Invalid price for product "${item.product.title}".`);
      }

      const lineTotal = unitPrice * item.quantity;
      aggregateTotal += lineTotal;

      if (!item.product.seller_id) {
        throw new Error(`Product "${item.product.title}" is missing seller association.`);
      }

      sellerIds.add(item.product.seller_id);

      orderItemsToInsert.push({
        product_id: item.product_id,
        seller_id: item.product.seller_id,
        quantity: item.quantity,
        price_at_purchase: unitPrice,
      });
    }

    const totalAmountRounded = parseFloat(aggregateTotal.toFixed(2));

    // Step c: Create parent record in `orders` table
    const orderPayload = {
      buyer_profile_id: buyerProfileId || null,
      guest_id: isGuest ? guestId : null,
      guest_email: finalGuestEmail,
      guest_phone: finalGuestPhone,
      total_amount: totalAmountRounded,
      status: 'PENDING',
      shipping_address: finalShippingAddress,
    };

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr || !order) {
      throw new Error(`Failed to create order record: ${orderErr ? orderErr.message : 'Unknown error'}`);
    }

    const orderId = order.id;

    // Step d: Map and bulk-insert items into `order_items` table
    const finalOrderItems = orderItemsToInsert.map(item => ({
      order_id: orderId,
      ...item,
    }));

    const { data: insertedOrderItems, error: itemsErr } = await supabase
      .from('order_items')
      .insert(finalOrderItems)
      .select();

    if (itemsErr) {
      // Rollback order creation if order_items insert fails
      await supabase.from('orders').delete().eq('id', orderId);
      throw new Error(`Failed to insert order line items: ${itemsErr.message}`);
    }

    // Step e: Atomically clear the user's/guest's cart_items
    await CartService.clearCart({ buyerProfileId, guestId });

    // Step f: Return generated order_id and success status details
    return {
      order_id: orderId,
      is_guest: !!isGuest,
      guest_id: isGuest ? guestId : null,
      guest_email: finalGuestEmail,
      guest_phone: finalGuestPhone,
      status: order.status,
      total_amount: totalAmountRounded,
      shipping_address: finalShippingAddress,
      total_items: cartItems.reduce((acc, curr) => acc + curr.quantity, 0),
      multivendor_sellers_count: sellerIds.size,
      order_items: insertedOrderItems || finalOrderItems,
      created_at: order.created_at,
    };
  }
}

module.exports = CheckoutService;
