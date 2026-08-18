const BuyerProfileService = require('../services/buyerProfileService');
const CartService = require('../services/cartService');
const CheckoutService = require('../services/checkoutService');

/**
 * Controller handling Buyer Workflow: Profiles, Cart (User & Guest), and Checkout.
 */

/**
 * Helper to resolve buyerProfileId if user is authenticated
 */
const resolveBuyerProfileId = async (user) => {
  if (!user || !user.id) return null;
  return await BuyerProfileService.getOrCreateProfileId(user.id);
};

// ==========================================
// PHASE 1: BUYER PROFILE CONTROLLERS
// ==========================================

/**
 * POST /api/buyer/profile
 * Initialize/create a buyer profile for the authenticated user session.
 */
const createBuyerProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const userId = req.user.id;
    const profile = await BuyerProfileService.createProfile(userId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Buyer profile initialized successfully.',
      profile,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create buyer profile.',
    });
  }
};

/**
 * GET /api/buyer/profile
 * Retrieve the logged-in buyer's profile details.
 */
const getBuyerProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const userId = req.user.id;
    const profile = await BuyerProfileService.getProfileByUserId(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Buyer profile not found for current session user.',
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching buyer profile.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/buyer/profile
 * Update current buyer's profile fields.
 */
const updateBuyerProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const userId = req.user.id;
    const updatedProfile = await BuyerProfileService.updateProfile(userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Buyer profile updated successfully.',
      profile: updatedProfile,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update buyer profile.',
    });
  }
};

// ==========================================
// PHASE 3: SHOPPING CART CONTROLLERS (User & Guest)
// ==========================================

/**
 * GET /api/buyer/cart
 * Retrieve all cart items for the user or guest session.
 */
const getCart = async (req, res) => {
  try {
    const buyerProfileId = await resolveBuyerProfileId(req.user);
    const guestId = req.guestId;

    const items = await CartService.getCartItems({ buyerProfileId, guestId });
    const grandTotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);

    return res.status(200).json({
      success: true,
      is_guest: req.isGuest,
      guest_id: req.guestId,
      count: items.length,
      grand_total: parseFloat(grandTotal.toFixed(2)),
      cart_items: items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving cart items.',
      error: error.message,
    });
  }
};

/**
 * POST /api/buyer/cart
 * Add item to cart for authenticated buyer or guest.
 */
const addToCart = async (req, res) => {
  try {
    const buyerProfileId = await resolveBuyerProfileId(req.user);
    const guestId = req.guestId;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required.',
      });
    }

    const cartItem = await CartService.addToCart({ buyerProfileId, guestId }, product_id, quantity);

    return res.status(201).json({
      success: true,
      is_guest: req.isGuest,
      guest_id: req.guestId,
      message: 'Item added to cart successfully.',
      cart_item: cartItem,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to add item to cart.',
    });
  }
};

/**
 * PATCH /api/buyer/cart/:id
 * Update quantity directly for cart item.
 */
const updateCartQuantity = async (req, res) => {
  try {
    const buyerProfileId = await resolveBuyerProfileId(req.user);
    const guestId = req.guestId;
    const cartItemId = req.params.id;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'quantity field is required.',
      });
    }

    const result = await CartService.updateCartItemQuantity({ buyerProfileId, guestId }, cartItemId, quantity);

    return res.status(200).json({
      success: true,
      message: result.deleted ? 'Item removed from cart.' : 'Cart item quantity updated successfully.',
      cart_item: result,
    });
  } catch (error) {
    const statusCode = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update cart item quantity.',
    });
  }
};

/**
 * DELETE /api/buyer/cart/:id
 * Remove item completely from cart.
 */
const removeFromCart = async (req, res) => {
  try {
    const buyerProfileId = await resolveBuyerProfileId(req.user);
    const guestId = req.guestId;
    const cartItemId = req.params.id;

    await CartService.removeFromCart({ buyerProfileId, guestId }, cartItemId);

    return res.status(200).json({
      success: true,
      message: 'Item removed completely from cart.',
    });
  } catch (error) {
    const statusCode = error.message.includes('Forbidden') ? 403 : error.message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to remove item from cart.',
    });
  }
};

// ==========================================
// PHASE 4: CHECKOUT CONTROLLER (User & Guest)
// ==========================================

/**
 * POST /api/buyer/checkout
 * Transactional checkout for User or Guest
 */
const checkout = async (req, res) => {
  try {
    const buyerProfileId = await resolveBuyerProfileId(req.user);
    const context = {
      userId: req.user ? req.user.id : null,
      buyerProfileId,
      guestId: req.guestId,
      isGuest: req.isGuest,
    };

    const orderResult = await CheckoutService.processCheckout(context, req.body);

    return res.status(201).json({
      success: true,
      message: 'Checkout completed successfully. Order placed.',
      order: orderResult,
    });
  } catch (error) {
    const isClientErr = error.statusCode === 400 ||
      error.message.includes('empty cart') ||
      error.message.includes('required') ||
      error.message.includes('compulsory') ||
      error.message.includes('Insufficient stock') ||
      error.message.includes('valid');

    const statusCode = error.statusCode || (isClientErr ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Checkout failed.',
    });
  }
};

module.exports = {
  createBuyerProfile,
  getBuyerProfile,
  updateBuyerProfile,
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  checkout,
};
