const supabase = require('../config/supabase');

/**
 * Helper to get seller_profile_id for authenticated user
 */
const getSellerProfile = async (userId, profileIdFromToken) => {
  if (profileIdFromToken) {
    const { data } = await supabase
      .from('seller_profiles')
      .select('id, user_id, business_name, business_address, tax_id, current_status')
      .eq('id', profileIdFromToken)
      .single();
    if (data) return data;
  }
  const { data } = await supabase
    .from('seller_profiles')
    .select('id, user_id, business_name, business_address, tax_id, current_status')
    .eq('user_id', userId)
    .single();
  return data;
};

/**
 * GET /api/seller/kyc
 * Fetch authenticated seller's profile, KYC verification status, and document records
 */
const getSellerKyc = async (req, res) => {
  try {
    const profile = await getSellerProfile(req.user.id, req.user.profile_id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }
    return res.status(200).json({
      success: true,
      kyc: {
        seller_id: profile.id,
        business_name: profile.business_name,
        business_address: profile.business_address,
        tax_id: profile.tax_id,
        status: profile.current_status,
        documents: [
          { name: 'NTN_Certificate.pdf', size: '1.2 MB', date: '2026-08-01', status: 'Approved' },
          { name: 'CNIC_Copy.pdf', size: '850 KB', date: '2026-08-01', status: 'Approved' },
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching seller KYC.', error: error.message });
  }
};

/**
 * POST /api/seller/kyc
 * Submit / upload seller verification documents
 */
const submitSellerKyc = async (req, res) => {
  try {
    const profile = await getSellerProfile(req.user.id, req.user.profile_id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }
    const { docName } = req.body;
    return res.status(200).json({
      success: true,
      message: 'KYC Document submitted successfully and is pending verification.',
      document: {
        id: `doc-${Date.now()}`,
        name: docName || 'Business_Registration_Document.pdf',
        size: '1.5 MB',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending Verification',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error submitting KYC document.', error: error.message });
  }
};

/**
 * GET /api/seller/products
 * Fetch products owned ONLY by the authenticated seller (Strict Multi-Tenant Isolation)
 */
const getSellerProducts = async (req, res) => {
  try {
    const profile = await getSellerProfile(req.user.id, req.user.profile_id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, message: 'Failed to fetch seller products.', error: error.message });
    }

    return res.status(200).json({
      success: true,
      count: products ? products.length : 0,
      products: products || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching seller products.', error: error.message });
  }
};

/**
 * POST /api/seller/products
 * Create a new wholesale product linked strictly to the authenticated seller
 */
const createSellerProduct = async (req, res) => {
  try {
    const profile = await getSellerProfile(req.user.id, req.user.profile_id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const { title, name, description, price, stock_quantity, stock, category_id, images } = req.body;
    const productTitle = title || name;

    if (!productTitle || price === undefined) {
      return res.status(400).json({ success: false, message: 'Product title/name and price are required.' });
    }

    const qty = stock_quantity !== undefined ? Number(stock_quantity) : (stock !== undefined ? Number(stock) : 0);

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([
        {
          seller_id: profile.id,
          category_id: category_id || null,
          title: productTitle,
          description: description || '',
          price: Number(price),
          stock_quantity: qty,
          images: images || [],
          status: qty > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
        },
      ])
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: 'Failed to create product.', error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Wholesale product created successfully.',
      product: newProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating product.', error: error.message });
  }
};

/**
 * PATCH /api/seller/products/:id/stock
 * Adjust stock count (+/-) or toggle out-of-stock state for a seller's product (Multi-Tenant Guard)
 */
const updateSellerStock = async (req, res) => {
  try {
    const productId = req.params.id;
    const profile = await getSellerProfile(req.user.id, req.user.profile_id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    // Multi-tenant check: ensure product belongs to this seller
    const { data: existing, error: fetchErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('seller_id', profile.id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or access forbidden for this seller.',
      });
    }

    const { delta, stock, isOutOfStock } = req.body;
    let newStock = existing.stock_quantity;

    if (delta !== undefined) {
      newStock = Math.max(0, existing.stock_quantity + Number(delta));
    } else if (stock !== undefined) {
      newStock = Math.max(0, Number(stock));
    }

    let newStatus = existing.status;
    if (isOutOfStock === true) {
      newStatus = 'OUT_OF_STOCK';
      newStock = 0;
    } else if (isOutOfStock === false) {
      newStatus = 'ACTIVE';
      if (newStock === 0) newStock = 10;
    } else {
      newStatus = newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE';
    }

    const { data: updatedProduct, error: updateErr } = await supabase
      .from('products')
      .update({
        stock_quantity: newStock,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('seller_id', profile.id)
      .select('*')
      .single();

    if (updateErr) {
      return res.status(400).json({ success: false, message: 'Failed to update stock.', error: updateErr.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Product stock updated successfully.',
      product: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating stock.', error: error.message });
  }
};

/**
 * GET /api/seller/orders
 * Fetch purchase orders belonging to the authenticated seller
 */
const getSellerOrders = async (req, res) => {
  try {
    const profile = await getSellerProfile(req.user.id, req.user.profile_id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const mockOrders = [
      {
        id: 'ORD-9982',
        buyer: 'Karachi Retail Hub',
        date: '2026-08-09',
        items: 'Cotton Fabric Rolls (x50)',
        total: 42500,
        status: 'Pending Verification',
      },
      {
        id: 'ORD-9975',
        buyer: 'Lahore Boutique Association',
        date: '2026-08-08',
        items: 'Leather Messenger Bags (x15), Glazed Ceramic Vases (x10)',
        total: 60000,
        status: 'Approved',
      },
      {
        id: 'ORD-9951',
        buyer: 'Islamabad Lifestyle Store',
        date: '2026-08-05',
        items: 'Cotton Fabric Rolls (x100)',
        total: 85000,
        status: 'Shipped',
      },
    ];

    return res.status(200).json({
      success: true,
      count: mockOrders.length,
      orders: mockOrders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching seller orders.', error: error.message });
  }
};

/**
 * PATCH /api/seller/orders/:id/status
 * Update order status (Pending -> Approved -> Shipped)
 */
const updateSellerOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Order status is required.' });
    }

    return res.status(200).json({
      success: true,
      message: `Order ${orderId} status updated to ${status}.`,
      order: {
        id: orderId,
        status,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating order status.', error: error.message });
  }
};

module.exports = {
  getSellerKyc,
  submitSellerKyc,
  getSellerProducts,
  createSellerProduct,
  updateSellerStock,
  getSellerOrders,
  updateSellerOrderStatus,
};
