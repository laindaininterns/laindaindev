const supabase = require('../config/supabase');

// GET /api/products/categories — public
const getCategories = async (req, res) => {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) return res.status(400).json({ success: false, error: error.message });
  return res.json({ success: true, categories: data });
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
  if (req.user.role !== 'SELLER')
    return res.status(403).json({ success: false, message: 'Only sellers can create products.' });

  const { sellerId, error: sellerErr } = await resolveApprovedSeller(req.user.id);
  if (sellerErr) return res.status(403).json({ success: false, message: sellerErr });

  const { title, description, price, stock_quantity, images, status, category_id } = req.body;
  if (!title || price == null) return res.status(400).json({ success: false, message: 'title and price are required.' });

  const { data, error } = await supabase
    .from('products')
    .insert({ seller_id: sellerId, category_id, title, description, price, stock_quantity, images, status })
    .select()
    .single();

  if (error) return res.status(400).json({ success: false, error: error.message });
  return res.status(201).json({ success: true, product: data });
};

// GET /api/products — public, optional ?category_id=
const listProducts = async (req, res) => {
  let query = supabase
    .from('products')
    .select('*, categories(id, name, slug), seller_profiles(id, business_name)')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  if (req.query.category_id) query = query.eq('category_id', req.query.category_id);

  const { data, error } = await query;
  if (error) return res.status(400).json({ success: false, error: error.message });
  return res.json({ success: true, count: data.length, products: data });
};

// GET /api/products/:id — public single product
const getProduct = async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(id, name, slug), seller_profiles(id, business_name)')
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ success: false, message: 'Product not found.' });
  return res.json({ success: true, product: data });
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
  const { error: ownerErr } = await assertOwnership(req.params.id, req.user.id);
  if (ownerErr) return res.status(403).json({ success: false, message: ownerErr });

  const allowed = ['title', 'description', 'price', 'stock_quantity', 'images', 'status', 'category_id'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

  const { data, error } = await supabase.from('products').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ success: false, error: error.message });
  return res.json({ success: true, product: data });
};

// DELETE /api/products/:id — seller ownership required
const deleteProduct = async (req, res) => {
  const { error: ownerErr } = await assertOwnership(req.params.id, req.user.id);
  if (ownerErr) return res.status(403).json({ success: false, message: ownerErr });

  const { error } = await supabase.from('products').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ success: false, error: error.message });
  return res.json({ success: true, message: 'Product deleted successfully.' });
};

module.exports = { getCategories, createProduct, listProducts, getProduct, updateProduct, deleteProduct };
