const supabase = require('../config/supabase');
const BuyerProductService = require('../services/buyerProductService');

// GET /api/products/categories — public
const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, categories: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Resolve seller_id from authenticated user, enforce APPROVED status
const resolveApprovedSeller = async (userId) => {
  const { data, error } = await supabase
    .from('seller_profiles')
    .select('id, current_status')
    .eq('user_id', userId)
    .single();
  if (error || !data) return { error: 'Seller profile not found.' };
  if (data.current_status !== 'APPROVED') return { error: 'Seller account is not APPROVED.' };
  return { sellerId: data.id };
};

// POST /api/products — authenticated SELLER (APPROVED only)
const createProduct = async (req, res) => {
  try {
    if (req.user.role !== 'SELLER')
      return res.status(403).json({ success: false, message: 'Only sellers can create products.' });

    const { sellerId, error: sellerErr } = await resolveApprovedSeller(req.user.id);
    if (sellerErr) return res.status(403).json({ success: false, message: sellerErr });

    const { title, description, price, stock_quantity, images, status, category_id } = req.body;
    if (!title || price == null) return res.status(400).json({ success: false, message: 'title and price are required.' });

    const { data, error } = await supabase
      .from('products')
      .insert({ seller_id: sellerId, category_id, title, description, price, stock_quantity, images, status: status || 'APPROVED' })
      .select()
      .single();

    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, product: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/products — public Marketplace Feed
 * Supports:
 * - Filtering products strictly by 'APPROVED' or 'ACTIVE' status
 * - Filtering by `category` (category ID or slug, or `category_id`)
 * - Basic text `search` query matching title or description
 * - Pagination (`page`, `limit`)
 */
const listProducts = async (req, res) => {
  try {
    const category = req.query.category || req.query.category_id;
    const search = req.query.search || req.query.q;
    const page = req.query.page;
    const limit = req.query.limit;

    const result = await BuyerProductService.getApprovedProducts({ category, search, page, limit });

    return res.status(200).json({
      success: true,
      count: result.products.length,
      total_count: result.count,
      page: result.page,
      limit: result.limit,
      total_pages: result.totalPages,
      products: result.products,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/products/:id — public single product details & full specifications
 */
const getProduct = async (req, res) => {
  try {
    const product = await BuyerProductService.getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching product specifications.', error: error.message });
  }
};

// Verify seller owns the product
const assertOwnership = async (productId, userId) => {
  const { data: seller } = await supabase.from('seller_profiles').select('id').eq('user_id', userId).single();
  if (!seller) return { error: 'Seller profile not found.' };
  const { data: product } = await supabase.from('products').select('id, seller_id').eq('id', productId).single();
  if (!product) return { error: 'Product not found.' };
  if (product.seller_id !== seller.id) return { error: 'Forbidden: you do not own this product.' };
  return { product };
};

// PATCH /api/products/:id — seller ownership required
const updateProduct = async (req, res) => {
  try {
    const { error: ownerErr } = await assertOwnership(req.params.id, req.user.id);
    if (ownerErr) return res.status(403).json({ success: false, message: ownerErr });

    const allowed = ['title', 'description', 'price', 'stock_quantity', 'images', 'status', 'category_id'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await supabase.from('products').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, product: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id — seller ownership required
const deleteProduct = async (req, res) => {
  try {
    const { error: ownerErr } = await assertOwnership(req.params.id, req.user.id);
    if (ownerErr) return res.status(403).json({ success: false, message: ownerErr });

    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCategories, createProduct, listProducts, getProduct, updateProduct, deleteProduct };
