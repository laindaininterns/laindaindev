const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { verifyToken } = require('../middleware/auth');
const { verifySeller } = require('../middleware/sellerAuth');

// Enforce authentication & SELLER role check on all seller routes
router.use(verifyToken, verifySeller);

/**
 * @route   GET /api/seller/kyc
 * @desc    Fetch seller KYC status and document records
 * @access  Private (Seller)
 */
router.get('/kyc', sellerController.getSellerKyc);

/**
 * @route   POST /api/seller/kyc
 * @desc    Upload seller verification document
 * @access  Private (Seller)
 */
router.post('/kyc', sellerController.submitSellerKyc);

/**
 * @route   GET /api/seller/products
 * @desc    Fetch products owned ONLY by the authenticated seller (Multi-Tenant Isolation)
 * @access  Private (Seller)
 */
router.get('/products', sellerController.getSellerProducts);

/**
 * @route   POST /api/seller/products
 * @desc    Create a new wholesale product linked to authenticated seller
 * @access  Private (Seller)
 */
router.post('/products', sellerController.createSellerProduct);

/**
 * @route   PATCH /api/seller/products/:id/stock
 * @desc    Adjust product stock quantity (+/-) or toggle out-of-stock
 * @access  Private (Seller)
 */
router.patch('/products/:id/stock', sellerController.updateSellerStock);

/**
 * @route   GET /api/seller/orders
 * @desc    Fetch purchase orders belonging to authenticated seller
 * @access  Private (Seller)
 */
router.get('/orders', sellerController.getSellerOrders);

/**
 * @route   PATCH /api/seller/orders/:id/status
 * @desc    Update order fulfillment status (Pending -> Approved -> Shipped)
 * @access  Private (Seller)
 */
router.patch('/orders/:id/status', sellerController.updateSellerOrderStatus);

module.exports = router;
