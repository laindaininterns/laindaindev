const supabase = require('../config/supabase');

/**
 * Helper to resolve seller_profile strictly for the authenticated user
 */
const getSellerProfile = async (userId, profileIdFromToken) => {
  if (profileIdFromToken) {
    const { data } = await supabase
      .from('seller_profiles')
      .select('id, user_id, business_name, business_address, contact_number, city, main_category, ntn_number, tax_id, current_status, uploaded_docs, approved_at, approved_by')
      .eq('id', profileIdFromToken)
      .single();
    if (data) return data;
  }
  if (userId) {
    const { data } = await supabase
      .from('seller_profiles')
      .select('id, user_id, business_name, business_address, contact_number, city, main_category, ntn_number, tax_id, current_status, uploaded_docs, approved_at, approved_by')
      .eq('user_id', userId)
      .single();
    if (data) return data;
  }
  return null;
};

/**
 * GET /api/seller/profile
 * Fetch authenticated seller's profile details strictly
 */
const getSellerProfileData = async (req, res) => {
  try {
    const profile = await getSellerProfile(req.user.id, req.user.profile_id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found for authenticated user.',
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching seller profile.',
      error: error.message,
    });
  }
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
        business_name: profile.business_name || 'Wholesale Supplier',
        business_address: profile.business_address || '',
        tax_id: profile.tax_id || profile.ntn_number || '',
        status: profile.current_status || 'PENDING',
        documents: profile.uploaded_docs || [],
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
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: docName || 'Business_Registration_Document.pdf',
      size: '1.5 MB',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending Verification',
    };

    const updatedDocs = [...(profile.uploaded_docs || []), newDoc];

    await supabase
      .from('seller_profiles')
      .update({ uploaded_docs: updatedDocs })
      .eq('id', profile.id);

    return res.status(200).json({
      success: true,
      message: 'KYC Document submitted successfully and is pending verification.',
      document: newDoc,
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
      .select('*, categories(id, name, slug)')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      count: (products || []).length,
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

    let { title, name, description, desc, price, stock_quantity, stock, moq, category_id, cat, sku, images, photos, isOutOfStock, is_out_of_stock } = req.body;
    const productTitle = title || name;

    if (!productTitle || price === undefined) {
      return res.status(400).json({ success: false, message: 'Product title/name and price are required.' });
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

    // Force seller_id = profile.id (prevents assigning to any other seller)
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert([
        {
          seller_id: profile.id,
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
      message: 'Wholesale product created successfully.',
      product: newProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating product.', error: error.message });
  }
};

/**
 * PATCH /api/seller/products/:id
 * Update product specifications for a seller's product (Ownership Guard)
 */
const updateSellerProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const profile = await getSellerProfile(req.user.id, req.user.profile_id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    // Check ownership
    const { data: existing, error: findErr } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('seller_id', profile.id)
      .single();

    if (findErr || !existing) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized.' });
    }

    const allowed = ['title', 'description', 'price', 'stock_quantity', 'images', 'category_id', 'sku', 'moq', 'is_out_of_stock'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.name && !updates.title) updates.title = req.body.name;
    if (req.body.desc && !updates.description) updates.description = req.body.desc;
    if (req.body.photos && !updates.images) updates.images = req.body.photos;
    if (req.body.stock !== undefined && updates.stock_quantity === undefined) updates.stock_quantity = Number(req.body.stock);
    if (req.body.isOutOfStock !== undefined && updates.is_out_of_stock === undefined) updates.is_out_of_stock = Boolean(req.body.isOutOfStock);

    if (updates.stock_quantity !== undefined || updates.is_out_of_stock !== undefined) {
      const q = updates.stock_quantity !== undefined ? updates.stock_quantity : existing.stock_quantity;
      const o = updates.is_out_of_stock !== undefined ? updates.is_out_of_stock : existing.is_out_of_stock;
      updates.status = q > 0 && !o ? 'APPROVED' : 'OUT_OF_STOCK';
    }

    const { data: updated, error: updateErr } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .eq('seller_id', profile.id)
      .select('*, categories(id, name, slug)')
      .single();

    if (updateErr) {
      return res.status(400).json({ success: false, error: updateErr.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating product.', error: error.message });
  }
};

/**
 * DELETE /api/seller/products/:id
 * Delete a product owned by authenticated seller (Ownership Guard)
 */
const deleteSellerProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const profile = await getSellerProfile(req.user.id, req.user.profile_id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    const { data: deleted, error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', profile.id)
      .select('id')
      .single();

    if (error || !deleted) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized.' });
    }

    return res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting product.', error: error.message });
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

    const { delta, stock, isOutOfStock } = req.body;

    const { data: existing, error: findErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('seller_id', profile.id)
      .single();

    if (findErr || !existing) {
      return res.status(404).json({ success: false, message: 'Product not found or unauthorized.' });
    }

    let newStock = existing.stock_quantity;
    if (stock !== undefined) {
      newStock = Math.max(0, Number(stock));
    } else if (delta !== undefined) {
      newStock = Math.max(0, existing.stock_quantity + Number(delta));
    }

    const nextIsOut = isOutOfStock !== undefined ? Boolean(isOutOfStock) : (newStock === 0);

    const { data: updated, error: updateErr } = await supabase
      .from('products')
      .update({
        stock_quantity: newStock,
        is_out_of_stock: nextIsOut,
        status: newStock > 0 && !nextIsOut ? 'APPROVED' : 'OUT_OF_STOCK',
      })
      .eq('id', productId)
      .eq('seller_id', profile.id)
      .select('*')
      .single();

    if (updateErr) {
      return res.status(400).json({ success: false, error: updateErr.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Product stock updated successfully.',
      product: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating stock.', error: error.message });
  }
};

module.exports = {
  getSellerProfileData,
  getSellerKyc,
  submitSellerKyc,
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  updateSellerStock,
};
