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

// Resolve seller_id from authenticated user or fallback to first active seller
const resolveSellerForProduct = async (user) => {
  if (user && user.id) {
    const { data } = await supabase
      .from('seller_profiles')
      .select('id, current_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data && data.id) return data.id;
  }

  // Fallback to first available seller profile in database
  const { data: firstSeller } = await supabase
    .from('seller_profiles')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (firstSeller && firstSeller.id) {
    return firstSeller.id;
  }

  throw new Error('No active seller profile found in database.');
};

// POST /api/products — create product in Supabase database with category_id resolution
const createProduct = async (req, res) => {
  try {
    const sellerId = await resolveSellerForProduct(req.user);

    let { title, name, description, desc, price, stock_quantity, stock, moq, category_id, cat, sku, images, photos, isOutOfStock, is_out_of_stock } = req.body;
    const productTitle = title || name;

    if (!productTitle || price == null) {
      return res.status(400).json({ success: false, message: 'title/name and price are required.' });
    }

    // Resolve category_id if category name string (cat) is passed instead of UUID
    if (!category_id && cat) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', cat.trim())
        .maybeSingle();

      if (categoryData && categoryData.id) {
        category_id = categoryData.id;
      }
    }

    const qty = stock_quantity !== undefined ? Number(stock_quantity) : (stock !== undefined ? Number(stock) : 0);
    const outOfStockBool = is_out_of_stock !== undefined ? Boolean(is_out_of_stock) : (isOutOfStock !== undefined ? Boolean(isOutOfStock) : qty === 0);
    const productSku = sku || `TX-${Math.floor(Math.random() * 9000 + 1000)}`;
    const productMoq = moq ? Number(moq) : 10;

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([
        {
          seller_id: sellerId,
          category_id: category_id || null,
          title: productTitle,
          sku: productSku,
          description: description || desc || '',
          price: Number(price),
          moq: productMoq,
          stock_quantity: qty,
          images: images || photos || [],
          is_out_of_stock: outOfStockBool,
          status: qty > 0 && !outOfStockBool ? 'APPROVED' : 'OUT_OF_STOCK',
        },
      ])
      .select('*, categories(id, name, slug), seller_profiles(id, business_name)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Product created and persisted in Supabase database with category_id.',
      product: newProduct,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/products — public Marketplace Feed
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

// PATCH /api/products/:id — update product fields and sync category_id to Supabase database
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Multi-tenant Ownership guard for sellers
    if (req.user && req.user.role === 'SELLER') {
      const { data: sellerProfile } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (sellerProfile) {
        const { data: prodCheck } = await supabase
          .from('products')
          .select('id')
          .eq('id', productId)
          .eq('seller_id', sellerProfile.id)
          .maybeSingle();

        if (!prodCheck) {
          return res.status(403).json({ success: false, message: 'Unauthorized: Product belongs to another vendor.' });
        }
      }
    }

    const allowed = ['title', 'description', 'price', 'stock_quantity', 'images', 'status', 'category_id', 'sku', 'moq', 'is_out_of_stock'];
    const updates = {};
    
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    if (req.body.name && !updates.title) updates.title = req.body.name;
    if (req.body.stock !== undefined && updates.stock_quantity === undefined) updates.stock_quantity = Number(req.body.stock);
    if (req.body.isOutOfStock !== undefined && updates.is_out_of_stock === undefined) updates.is_out_of_stock = Boolean(req.body.isOutOfStock);
    if (req.body.desc && !updates.description) updates.description = req.body.desc;
    if (req.body.photos && !updates.images) updates.images = req.body.photos;

    // Resolve category_id if category name string (cat) is passed instead of UUID
    if (!updates.category_id && req.body.cat) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', req.body.cat.trim())
        .maybeSingle();

      if (categoryData && categoryData.id) {
        updates.category_id = categoryData.id;
      }
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select('*, categories(id, name, slug)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated and saved in Supabase database.',
      product: data,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id — seller ownership / demo delete
const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Multi-tenant Ownership guard for sellers
    if (req.user && req.user.role === 'SELLER') {
      const { data: sellerProfile } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (sellerProfile) {
        const { data: prodCheck } = await supabase
          .from('products')
          .select('id')
          .eq('id', productId)
          .eq('seller_id', sellerProfile.id)
          .maybeSingle();

        if (!prodCheck) {
          return res.status(403).json({ success: false, message: 'Unauthorized: Product belongs to another vendor.' });
        }
      }
    }

    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCategories, createProduct, listProducts, getProduct, updateProduct, deleteProduct };
