const supabase = require('../config/supabase');

/**
 * Service to manage Database-Backed Shopping Cart operations for both Authenticated Buyers and Guests.
 */
class CartService {
  /**
   * Helper to build filter query for owner (buyerProfileId or guestId)
   */
  static _applyOwnerFilter(query, { buyerProfileId, guestId }) {
    if (buyerProfileId) {
      return query.eq('buyer_profile_id', buyerProfileId);
    } else if (guestId) {
      return query.eq('guest_id', guestId);
    } else {
      throw new Error('Either Buyer Profile ID or Guest ID must be provided.');
    }
  }

  /**
   * Fetch all cart items for a buyer or guest session with joined product details
   * @param {Object} context - { buyerProfileId, guestId }
   * @returns {Promise<Array>} List of cart items with product info
   */
  static async getCartItems({ buyerProfileId, guestId }) {
    if (!buyerProfileId && !guestId) {
      throw new Error('Buyer Profile ID or Guest ID is required.');
    }

    let query = supabase
      .from('cart_items')
      .select(`
        id,
        buyer_profile_id,
        guest_id,
        product_id,
        quantity,
        created_at,
        updated_at,
        products (
          id,
          title,
          description,
          price,
          stock_quantity,
          images,
          status,
          seller_id,
          seller_profiles (
            id,
            business_name
          )
        )
      `);

    query = this._applyOwnerFilter(query, { buyerProfileId, guestId });
    query = query.order('created_at', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to retrieve cart items: ${error.message}`);
    }

    // Map response to standard structured objects
    return (data || []).map(item => ({
      cart_item_id: item.id,
      buyer_profile_id: item.buyer_profile_id,
      guest_id: item.guest_id,
      product_id: item.product_id,
      quantity: item.quantity,
      created_at: item.created_at,
      updated_at: item.updated_at,
      product: item.products ? {
        id: item.products.id,
        title: item.products.title,
        price: parseFloat(item.products.price),
        image: item.products.images && item.products.images.length > 0 ? item.products.images[0] : null,
        images: item.products.images || [],
        seller_id: item.products.seller_id,
        seller_name: item.products.seller_profiles ? item.products.seller_profiles.business_name : 'Marketplace Seller',
        stock_quantity: item.products.stock_quantity,
        status: item.products.status,
      } : null,
      subtotal: item.products ? parseFloat((parseFloat(item.products.price) * item.quantity).toFixed(2)) : 0,
    }));
  }

  /**
   * Add product to cart, or increment quantity if item already present in cart
   * @param {Object} context - { buyerProfileId, guestId }
   * @param {string} productId 
   * @param {number} [quantity=1] 
   * @returns {Promise<Object>} Added/Updated cart item
   */
  static async addToCart({ buyerProfileId, guestId }, productId, quantity = 1) {
    if (!buyerProfileId && !guestId) {
      throw new Error('Buyer Profile ID or Guest ID is required.');
    }
    if (!productId) {
      throw new Error('Product ID is required.');
    }

    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    // Verify product exists and check stock quantity
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, title, price, stock_quantity, status')
      .eq('id', productId)
      .maybeSingle();

    if (prodErr || !product) {
      throw new Error('Product not found or unavailable.');
    }

    if (product.stock_quantity < qtyToAdd) {
      throw new Error(`Insufficient stock. Only ${product.stock_quantity} item(s) available.`);
    }

    // Check if cart item already exists for this owner & product
    let checkQuery = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('product_id', productId);

    checkQuery = this._applyOwnerFilter(checkQuery, { buyerProfileId, guestId });

    const { data: existingItem, error: fetchErr } = await checkQuery.maybeSingle();

    if (fetchErr) {
      throw new Error(`Database error checking cart: ${fetchErr.message}`);
    }

    if (existingItem) {
      // Increment quantity
      const newQuantity = existingItem.quantity + qtyToAdd;
      
      if (product.stock_quantity < newQuantity) {
        throw new Error(`Cannot add more. Total in cart (${newQuantity}) exceeds stock (${product.stock_quantity}).`);
      }

      const { data: updated, error: updateErr } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(`Failed to update cart quantity: ${updateErr.message}`);
      }

      return updated;
    } else {
      // Insert new cart item
      const insertPayload = {
        buyer_profile_id: buyerProfileId || null,
        guest_id: buyerProfileId ? null : guestId,
        product_id: productId,
        quantity: qtyToAdd,
      };

      const { data: newItem, error: insertErr } = await supabase
        .from('cart_items')
        .insert(insertPayload)
        .select()
        .single();

      if (insertErr) {
        throw new Error(`Failed to add item to cart: ${insertErr.message}`);
      }

      return newItem;
    }
  }

  /**
   * Directly update cart item quantity (for increment/decrement controls)
   * @param {Object} context - { buyerProfileId, guestId }
   * @param {string} cartItemId 
   * @param {number} quantity 
   * @returns {Promise<Object|null>}
   */
  static async updateCartItemQuantity({ buyerProfileId, guestId }, cartItemId, quantity) {
    if (!cartItemId) {
      throw new Error('Cart Item ID is required.');
    }

    const newQty = parseInt(quantity, 10);

    // If quantity is <= 0, remove item from cart
    if (isNaN(newQty) || newQty <= 0) {
      await this.removeFromCart({ buyerProfileId, guestId }, cartItemId);
      return { id: cartItemId, deleted: true, message: 'Item removed from cart.' };
    }

    // Check item ownership & product stock limit
    const { data: cartItem, error: fetchErr } = await supabase
      .from('cart_items')
      .select('id, buyer_profile_id, guest_id, product_id, products(stock_quantity)')
      .eq('id', cartItemId)
      .maybeSingle();

    if (fetchErr || !cartItem) {
      throw new Error('Cart item not found.');
    }

    // Assert ownership
    const isOwner = (buyerProfileId && cartItem.buyer_profile_id === buyerProfileId) ||
                    (guestId && cartItem.guest_id === guestId);

    if (!isOwner) {
      throw new Error('Forbidden: Cart item does not belong to user session.');
    }

    if (cartItem.products && cartItem.products.stock_quantity < newQty) {
      throw new Error(`Stock limit exceeded. Only ${cartItem.products.stock_quantity} available.`);
    }

    const { data: updated, error: updateErr } = await supabase
      .from('cart_items')
      .update({ quantity: newQty })
      .eq('id', cartItemId)
      .select()
      .single();

    if (updateErr) {
      throw new Error(`Failed to set cart quantity: ${updateErr.message}`);
    }

    return updated;
  }

  /**
   * Remove item completely from cart
   * @param {Object} context - { buyerProfileId, guestId }
   * @param {string} cartItemId 
   * @returns {Promise<boolean>}
   */
  static async removeFromCart({ buyerProfileId, guestId }, cartItemId) {
    if (!cartItemId) {
      throw new Error('Cart Item ID is required.');
    }

    // Verify ownership
    const { data: cartItem, error: fetchErr } = await supabase
      .from('cart_items')
      .select('id, buyer_profile_id, guest_id')
      .eq('id', cartItemId)
      .maybeSingle();

    if (fetchErr || !cartItem) {
      throw new Error('Cart item not found.');
    }

    const isOwner = (buyerProfileId && cartItem.buyer_profile_id === buyerProfileId) ||
                    (guestId && cartItem.guest_id === guestId);

    if (!isOwner) {
      throw new Error('Forbidden: Cart item does not belong to user session.');
    }

    const { error: deleteErr } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (deleteErr) {
      throw new Error(`Failed to remove cart item: ${deleteErr.message}`);
    }

    return true;
  }

  /**
   * Clear all cart items for a buyer profile or guest session
   * @param {Object} context - { buyerProfileId, guestId }
   */
  static async clearCart({ buyerProfileId, guestId }) {
    let query = supabase.from('cart_items').delete();
    query = this._applyOwnerFilter(query, { buyerProfileId, guestId });

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to clear cart: ${error.message}`);
    }
  }
}

module.exports = CartService;
