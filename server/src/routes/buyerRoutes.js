const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const { resolveGuestOrUser } = require('../middleware/guestOrUserMiddleware');
const {
  createBuyerProfile,
  getBuyerProfile,
  updateBuyerProfile,
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  checkout,
} = require('../controllers/buyerController');

const router = Router();

// ==========================================
// PHASE 1: BUYER PROFILE ROUTES (Strict Auth)
// ==========================================
router.post('/profile', verifyToken, createBuyerProfile);
router.get('/profile', verifyToken, getBuyerProfile);
router.put('/profile', verifyToken, updateBuyerProfile);

// ==========================================
// PHASE 3 & 4: CART & CHECKOUT (User or Guest)
// ==========================================
router.get('/cart', resolveGuestOrUser, getCart);
router.post('/cart', resolveGuestOrUser, addToCart);
router.patch('/cart/:id', resolveGuestOrUser, updateCartQuantity);
router.delete('/cart/:id', resolveGuestOrUser, removeFromCart);

router.post('/checkout', resolveGuestOrUser, checkout);

module.exports = router;
