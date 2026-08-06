const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
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

module.exports = router;
