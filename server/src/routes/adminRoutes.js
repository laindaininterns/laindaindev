const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminLogisticsController = require('../controllers/adminLogisticsController');
const { verifyToken } = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/adminAuth');

// Enforce authentication & admin role check on all admin routes
router.use(verifyToken, verifyAdmin);

/**
 * @route   GET /api/admin/sellers/pending
 * @desc    Fetch all sellers with seller_status = 'PENDING'
 * @access  Private (Admin)
 */
router.get('/sellers/pending', adminController.getPendingSellers);

/**
 * @route   PATCH /api/admin/sellers/:id/status
 * @desc    Update seller_status to 'APPROVED' or 'REJECTED' and trigger notification email
 * @access  Private (Admin)
 */
router.patch('/sellers/:id/status', adminController.updateSellerStatus);

/**
 * @route   GET /api/admin/orders
 * @desc    Fetch all marketplace orders across all buyers and sellers
 * @access  Private (Admin)
 */
router.get('/orders', adminLogisticsController.getAdminOrders);

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Global status override by Admin (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
 * @access  Private (Admin)
 */
router.patch('/orders/:id/status', adminLogisticsController.updateAdminOrderStatus);

/**
 * @route   GET /api/admin/buyers
 * @desc    Fetch all active buyers directory with store names & transaction totals
 * @access  Private (Admin)
 */
router.get('/buyers', adminController.getBuyersDirectory);

module.exports = router;

