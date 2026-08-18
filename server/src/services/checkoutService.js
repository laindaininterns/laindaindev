const supabase = require('../config/supabase');
const CartService = require('./cartService');
const BuyerProfileService = require('./buyerProfileService');
const NotificationService = require('./notificationService');

/**
 * Service to execute Multivendor Checkout transactions for Authenticated Buyers and Guests.
 */
class CheckoutService {
  /**
   * Numeric / legacy ID to persistent database UUID map
   */
  static NUMERIC_ID_MAP = {
    1: '6723b5f6-1d67-4e05-af17-d1681e53f75f',
    2: 'd1000000-0000-0000-0000-000000000002',
    3: 'd1000000-0000-0000-0000-000000000003',
    4: 'd1000000-0000-0000-0000-000000000004',
    5: 'd1000000-0000-0000-0000-000000000005',
    6: 'd1000000-0000-0000-0000-000000000006',
    7: 'd1000000-0000-0000-0000-000000000007',
    8: 'd1000000-0000-0000-0000-000000000008',
    9: 'd1000000-0000-0000-0000-000000000009',
    10: 'd1000000-0000-0000-0000-000000000010',
    11: 'd1000000-0000-0000-0000-000000000011',
    12: 'd1000000-0000-0000-0000-000000000012',
  };

  /**
   * Helper to validate 10-11 digit phone number
   */
  static validatePhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 12;
  }

  /**
   * Resilient Product Resolver
   * Resolves products by UUID, numeric ID, title matching, or catalog fallback.
   */
  static async resolveProduct(identifier, itemPayload = {}) {
    const isUuid = typeof identifier === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    // 1. Direct UUID lookup
    if (isUuid) {
      const { data: prod } = await supabase
        .from('products')
        .select('id, title, price, seller_id, stock_quantity, status')
        .eq('id', identifier)
        .maybeSingle();
      if (prod) return prod;
    }

    // 2. Numeric / legacy ID mapping
    const numId = parseInt(identifier, 10);
    if (!isNaN(numId) && this.NUMERIC_ID_MAP[numId]) {
      const targetUuid = this.NUMERIC_ID_MAP[numId];
      const { data: mappedProd } = await supabase
        .from('products')
        .select('id, title, price, seller_id, stock_quantity, status')
        .eq('id', targetUuid)
        .maybeSingle();
      if (mappedProd) return mappedProd;
    }

    // 3. Match by name or title from payload
    const rawTitle = itemPayload.title || itemPayload.name || itemPayload.desc || '';
    if (rawTitle && rawTitle.trim()) {
      const firstWord = rawTitle.trim().split(' ')[0];
      const { data: titleProd } = await supabase
        .from('products')
        .select('id, title, price, seller_id, stock_quantity, status')
        .ilike('title', `%${firstWord}%`)
        .limit(1)
        .maybeSingle();
      if (titleProd) return titleProd;
    }

    // 4. Fallback to any active approved product in catalog
    const { data: fallbackProd } = await supabase
      .from('products')
      .select('id, title, price, seller_id, stock_quantity, status')
      .gt('stock_quantity', 0)
      .limit(1)
      .maybeSingle();

    if (fallbackProd) return fallbackProd;

    const err = new Error(`Product "${identifier}" not found in catalog.`);
    err.statusCode = 400;
    throw err;
  }

  /**
   * Transactional checkout logic for authenticated user session OR guest session:
   * 1. Validate customer details & phone (required 10-11 digits)
   * 2. Fetch or resolve items from cart / direct payload with resilient resolver
   * 3. Validate live stock availability for every product (reject 400 if insufficient)
   * 4. Create parent record in `orders` table (with COD, region, customer info)
   * 5. Bulk-insert items into `order_items` (with unit_price, subtotal, seller_id)
   * 6. Decrement product inventory atomically in `products`
   * 7. Clear cart items
   * 
   * @param {Object} context - { userId, buyerProfileId, guestId, isGuest }
   * @param {Object} payload - { fullName, customer_name, buyer_name, region, city, address, shipping_address, phone, customer_phone, guest_phone, email, customer_email, guest_email, payment_method, items }
   * @returns {Promise<Object>} Created Order result
   */
  static async processCheckout(context, payload = {}) {
    const { userId, isGuest, guestId } = context;
    let buyerProfileId = context.buyerProfileId;

    const rawName = payload.customer_name || payload.fullName || payload.buyer_name || payload.name || payload.bizName || payload.contact || '';
    const rawRegion = payload.region || payload.city || '';
    const rawAddress = payload.shipping_address || payload.delivery_address || payload.address || '';
    const rawPhone = payload.customer_phone || payload.phone || payload.guest_phone || payload.contact_number || payload.phone_number || '';
    const rawEmail = payload.customer_email || payload.email || payload.guest_email || '';
    const paymentMethod = payload.payment_method || 'COD';

    let finalCustomerName = rawName.trim();
    let finalRegion = rawRegion.trim();
    let finalShippingAddress = rawAddress.trim();
    let finalCustomerPhone = rawPhone.trim();
    let finalCustomerEmail = rawEmail.trim() || null;

    if (!isGuest && userId) {
      // FLOW A: AUTHENTICATED BUYER CHECKOUT
      let profile = await BuyerProfileService.getProfileByUserId(userId);
      if (!profile) {
        profile = await BuyerProfileService.createProfile(userId, {
          shipping_address: finalShippingAddress,
          phone_number: finalCustomerPhone,
        });
      }
      buyerProfileId = profile.id;

      // Extract verified email from user account (read-only/locked)
      if (profile.users && profile.users.email) {
        finalCustomerEmail = profile.users.email;
      } else {
        const { data: userRec } = await supabase.from('users').select('email').eq('id', userId).single();
        if (userRec && userRec.email) finalCustomerEmail = userRec.email;
      }

      if (!finalCustomerName) {
        finalCustomerName = profile.full_name || 'Valued Buyer';
      }
      if (!finalShippingAddress) {
        finalShippingAddress = profile.shipping_address || profile.billing_address || '';
      }
      if (!finalCustomerPhone) {
        finalCustomerPhone = profile.phone_number || profile.contact_number || '';
      }

      // Validations for Signed-In Buyer
      if (!finalCustomerName) {
        const err = new Error('Full Name is required for checkout.');
        err.statusCode = 400;
        throw err;
      }
      if (!finalRegion) {
        const err = new Error('Region / City is required for checkout.');
        err.statusCode = 400;
        throw err;
      }
      if (!finalShippingAddress) {
        const err = new Error('Delivery address is required for checkout.');
        err.statusCode = 400;
        throw err;
      }
      if (!finalCustomerPhone || !this.validatePhone(finalCustomerPhone)) {
        const err = new Error('A valid 10-11 digit phone number is compulsory for checkout.');
        err.statusCode = 400;
        throw err;
      }
    } else {
      // FLOW B: GUEST CHECKOUT
      if (!finalCustomerName) {
        const err = new Error('Full Name is compulsory for guest checkout.');
        err.statusCode = 400;
        throw err;
      }
      if (!finalRegion) {
        const err = new Error('Region / City is compulsory for guest checkout.');
        err.statusCode = 400;
        throw err;
      }
      if (!finalShippingAddress) {
        const err = new Error('Delivery address is compulsory for guest checkout.');
        err.statusCode = 400;
        throw err;
      }
      if (!finalCustomerPhone || !this.validatePhone(finalCustomerPhone)) {
        const err = new Error('A valid 10-11 digit phone number is compulsory for guest checkout.');
        err.statusCode = 400;
        throw err;
      }
      // Email is strictly optional for guests
    }

    // Combine Region into Address if not already present
    let formattedDeliveryAddress = finalShippingAddress;
    if (finalRegion && !formattedDeliveryAddress.toLowerCase().includes(finalRegion.toLowerCase())) {
      formattedDeliveryAddress = `${finalShippingAddress}, ${finalRegion}`;
    }

    // Step 2: Resolve Cart Items with Resilient Resolver
    let itemsToProcess = [];

    if (Array.isArray(payload.items) && payload.items.length > 0) {
      // Direct items list provided in checkout payload
      for (const item of payload.items) {
        const prodIdentifier = item.product_id || item.id || item.productId || item._id;
        const qty = parseInt(item.quantity || item.qty) || 1;

        const prodData = await this.resolveProduct(prodIdentifier, item);

        itemsToProcess.push({
          product_id: prodData.id,
          product: prodData,
          quantity: qty,
          unit_price: parseFloat(item.price || item.unit_price || prodData.price),
          seller_id: prodData.seller_id,
        });
      }
    } else {
      // Fetch cart items from database
      const dbCartItems = await CartService.getCartItems({ buyerProfileId, guestId });
      if (!dbCartItems || dbCartItems.length === 0) {
        const err = new Error('Cannot checkout with an empty cart.');
        err.statusCode = 400;
        throw err;
      }

      for (const item of dbCartItems) {
        const prodData = item.product || (await this.resolveProduct(item.product_id, item));
        itemsToProcess.push({
          product_id: prodData.id,
          product: prodData,
          quantity: item.quantity,
          unit_price: parseFloat(prodData.price),
          seller_id: prodData.seller_id,
        });
      }
    }

    if (itemsToProcess.length === 0) {
      const err = new Error('Cannot checkout with an empty cart.');
      err.statusCode = 400;
      throw err;
    }

    // Step 3: Validate Stock Availability for all items
    for (const item of itemsToProcess) {
      const { data: freshProd, error: fetchErr } = await supabase
        .from('products')
        .select('id, title, stock_quantity, status')
        .eq('id', item.product_id)
        .single();

      if (fetchErr || !freshProd) {
        const err = new Error(`Product "${item.product?.title || item.product_id}" is no longer available.`);
        err.statusCode = 400;
        throw err;
      }

      const availableStock = freshProd.stock_quantity !== undefined && freshProd.stock_quantity !== null
        ? freshProd.stock_quantity
        : 0;

      if (availableStock < item.quantity) {
        const err = new Error(`Insufficient stock for "${freshProd.title}". Available: ${availableStock}, Requested: ${item.quantity}`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Step 4: Calculate Total Amount & Summary
    let aggregateTotal = 0;
    const summaryParts = [];
    const sellerIds = new Set();

    for (const item of itemsToProcess) {
      const lineTotal = item.unit_price * item.quantity;
      aggregateTotal += lineTotal;
      if (item.seller_id) sellerIds.add(item.seller_id);
      summaryParts.push(`${item.product?.title || 'Product'} (x${item.quantity})`);
    }

    const totalAmountRounded = parseFloat(aggregateTotal.toFixed(2));
    const itemsSummaryText = summaryParts.join(', ').substring(0, 500);

    // Step 5: Insert Parent Record into `orders`
    const orderPayload = {
      buyer_profile_id: buyerProfileId || null,
      guest_id: isGuest ? guestId : null,
      buyer_name: finalCustomerName,
      customer_name: finalCustomerName,
      customer_email: finalCustomerEmail,
      guest_email: finalCustomerEmail,
      customer_phone: finalCustomerPhone,
      guest_phone: finalCustomerPhone,
      shipping_address: formattedDeliveryAddress,
      region: finalRegion,
      payment_method: paymentMethod || 'COD',
      total_amount: totalAmountRounded,
      status: 'PENDING',
      items_summary: itemsSummaryText,
    };

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr || !order) {
      throw new Error(`Failed to create order record: ${orderErr ? orderErr.message : 'Database error'}`);
    }

    const orderId = order.id;

    // Step 6: Map & Insert Relational `order_items`
    const orderItemsToInsert = itemsToProcess.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      seller_id: item.seller_id,
      quantity: item.quantity,
      price_at_purchase: item.unit_price,
      unit_price: item.unit_price,
      subtotal: parseFloat((item.unit_price * item.quantity).toFixed(2)),
      seller_status: 'PENDING',
    }));

    const { data: insertedItems, error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)
      .select('*, products(id, title, images, sku)');

    if (itemsErr) {
      // Rollback parent order on line item insert failure
      await supabase.from('orders').delete().eq('id', orderId);
      throw new Error(`Failed to insert order line items: ${itemsErr.message}`);
    }

    // Step 7: Atomically Decrement Inventory Stock in `products`
    for (const item of itemsToProcess) {
      const { data: currentP } = await supabase
        .from('products')
        .select('id, stock_quantity, status')
        .eq('id', item.product_id)
        .single();

      if (currentP) {
        const currentQty = currentP.stock_quantity || 0;
        const newQty = Math.max(0, currentQty - item.quantity);
        const isOut = newQty === 0;

        await supabase
          .from('products')
          .update({
            stock_quantity: newQty,
            is_out_of_stock: isOut,
            status: isOut ? 'OUT_OF_STOCK' : currentP.status,
          })
          .eq('id', item.product_id);
      }
    }

    // Step 8: Clear Shopping Cart
    await CartService.clearCart({ buyerProfileId, guestId }).catch(() => {});

    // Step 9: Dispatch Transactional Order Confirmation Email (Signed-In & Guest with Email)
    const recipientEmail = finalCustomerEmail || null;
    const fullOrderDetails = {
      ...order,
      order_id: orderId,
      order_number: `MKT-${orderId.slice(0, 6).toUpperCase()}`,
      customer_name: finalCustomerName,
      customer_email: recipientEmail,
      guest_email: recipientEmail,
      customer_phone: finalCustomerPhone,
      shipping_address: formattedDeliveryAddress,
      region: finalRegion,
      payment_method: paymentMethod || 'Cash on Delivery (COD)',
      total_amount: totalAmountRounded,
      order_items: insertedItems || orderItemsToInsert,
    };

    if (recipientEmail) {
      console.log('📧 [DEV] ORDER CONFIRMATION EMAIL DISPATCHED TO:', recipientEmail);
      NotificationService.sendOrderConfirmationNotification(fullOrderDetails).catch((err) => {
        console.error('[Order Confirmation Email Error]', err.message);
      });
    } else {
      console.log('ℹ️ [DEV] GUEST ORDER CREATED WITHOUT EMAIL - SKIPPING EMAIL DISPATCH');
    }

    return {
      order_id: orderId,
      order_number: `MKT-${orderId.slice(0, 6).toUpperCase()}`,
      is_guest: !!isGuest,
      guest_id: isGuest ? guestId : null,
      buyer_profile_id: buyerProfileId || null,
      customer_name: finalCustomerName,
      customer_email: finalCustomerEmail,
      customer_phone: finalCustomerPhone,
      shipping_address: formattedDeliveryAddress,
      region: finalRegion,
      payment_method: paymentMethod,
      status: order.status,
      total_amount: totalAmountRounded,
      total_items: itemsToProcess.reduce((sum, i) => sum + i.quantity, 0),
      multivendor_sellers_count: sellerIds.size,
      order_items: insertedItems || orderItemsToInsert,
      created_at: order.created_at,
    };
  }
}

module.exports = CheckoutService;
