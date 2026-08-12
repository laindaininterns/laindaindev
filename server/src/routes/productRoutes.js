const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');
const {
  getCategories, createProduct, listProducts, getProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');

const router = Router();

// Optional JWT authentication parser for product creation
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      // Ignore invalid token, proceed with optional context
    }
  }
  next();
};

router.get('/categories', getCategories);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', optionalAuth, createProduct);
router.patch('/:id', verifyToken, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

module.exports = router;
