const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const {
  getCategories, createProduct, listProducts, getProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');

const router = Router();

router.get('/categories', getCategories);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', verifyToken, createProduct);
router.patch('/:id', verifyToken, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

module.exports = router;
