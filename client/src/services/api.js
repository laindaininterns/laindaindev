const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Register a Buyer account in Supabase via backend API
 */
export async function registerBuyerRequest(formData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formData.email,
      password: formData.password,
      role: 'BUYER',
      profileData: {
        contact_number: formData.bizName,
        billing_address: formData.fullName,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Registration failed. Please try again.');
  }

  if (data.token) {
    localStorage.setItem('auth_token', data.token);
  }

  return { name: formData.fullName || data.user.email.split('@')[0], email: data.user.email, ...data };
}

/**
 * Register a Seller account in Supabase via backend API
 */
export async function registerSellerRequest(formData) {
  const password = formData.password || 'SellerPass123!';

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formData.email,
      password,
      role: 'SELLER',
      profileData: {
        business_name: formData.bizName,
        contact_number: formData.bizPhone,
        business_address: `${formData.city}, Pakistan`,
        tax_id: formData.ntnNumber,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Seller registration failed. Please try again.');
  }

  if (data.token) {
    localStorage.setItem('auth_token', data.token);
  }

  const refId = data.profile?.id ? `SUP-${data.profile.id.substring(0, 6).toUpperCase()}` : `SUP-${Math.floor(100000 + Math.random() * 900000)}`;

  return { refId, bizName: formData.bizName, ...data };
}

/**
 * Login user via backend API
 */
export async function loginUserRequest(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Invalid email or password.');
  }

  if (data.token) {
    localStorage.setItem('auth_token', data.token);
  }

  const displayName =
    data.profile?.billing_address ||
    data.profile?.business_name ||
    data.profile?.full_name ||
    (data.user?.email ? data.user.email.split('@')[0] : email.split('@')[0]);

  return { name: displayName, email: data.user?.email || email, role: data.user?.role, ...data };
}

/**
 * Fetch products live from Supabase database via backend API
 */
export async function fetchSellerProductsRequest() {
  const token = localStorage.getItem('auth_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/seller/products`, { headers });
    const data = await response.json();

    if (response.ok && data.success) {
      if (!data.products || data.products.length === 0) {
        return [];
      }
      return data.products.map((p) => ({
        id: p.id,
        name: p.title || p.name,
        sku: p.sku || `TX-${p.id.substring(0, 4).toUpperCase()}`,
        cat: p.categories?.name || p.cat || 'Clothing & Apparel',
        price: parseFloat(p.price),
        stock: p.stock_quantity !== undefined ? p.stock_quantity : (p.stock || 0),
        isOutOfStock: p.is_out_of_stock !== undefined ? p.is_out_of_stock : (p.stock === 0),
        moq: p.moq || 10,
        desc: p.description || p.desc || '',
        photos: p.images && p.images.length > 0 ? p.images : (p.photos || []),
      }));
    }
  } catch (err) {
    console.warn('Seller API endpoint error, falling back to public feed:', err.message);
  }

  // Fallback to public products endpoint
  try {
    const res2 = await fetch(`${API_BASE_URL}/products`);
    const data2 = await res2.json();
    if (res2.ok && data2.success) {
      if (!data2.products || data2.products.length === 0) {
        return [];
      }
      return data2.products.map((p) => ({
        id: p.id,
        name: p.title || p.name,
        sku: p.sku || `TX-${p.id.substring(0, 4).toUpperCase()}`,
        cat: p.categories?.name || p.cat || 'Clothing & Apparel',
        price: parseFloat(p.price),
        stock: p.stock_quantity !== undefined ? p.stock_quantity : (p.stock || 0),
        isOutOfStock: p.is_out_of_stock !== undefined ? p.is_out_of_stock : (p.stock === 0),
        moq: p.moq || 10,
        desc: p.description || p.desc || '',
        photos: p.images && p.images.length > 0 ? p.images : (p.photos || []),
      }));
    }
  } catch (e) {}

  return [];
}

/**
 * Create a new product in Supabase via backend API
 */
export async function createProductRequest(productData) {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: productData.name || productData.title,
      name: productData.name || productData.title,
      sku: productData.sku,
      cat: productData.cat,
      price: parseFloat(productData.price),
      moq: parseInt(productData.moq) || 10,
      stock_quantity: parseInt(productData.stock) || 0,
      stock: parseInt(productData.stock) || 0,
      description: productData.desc || productData.description || '',
      desc: productData.desc || productData.description || '',
      photos: productData.photos || productData.images || [],
      images: productData.photos || productData.images || [],
      isOutOfStock: productData.isOutOfStock || false,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to save product in database.');
  }

  return data.product;
}

/**
 * Update existing product in Supabase via backend API
 */
export async function updateProductRequest(productId, updatedData) {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      title: updatedData.name || updatedData.title,
      price: updatedData.price !== undefined ? parseFloat(updatedData.price) : undefined,
      moq: updatedData.moq !== undefined ? parseInt(updatedData.moq) : undefined,
      stock_quantity: updatedData.stock !== undefined ? parseInt(updatedData.stock) : undefined,
      description: updatedData.desc !== undefined ? updatedData.desc : updatedData.description,
      images: updatedData.photos || updatedData.images,
      is_out_of_stock: updatedData.isOutOfStock,
      sku: updatedData.sku,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to update product in database.');
  }

  return data.product;
}

/**
 * Bulk save inventory changes (stock levels, out-of-stock flags) to Supabase database
 */
export async function saveInventoryChangesRequest(productsList) {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const results = await Promise.all(
    productsList.map(async (p) => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${p.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            stock_quantity: p.stock,
            is_out_of_stock: p.stock === 0 || p.isOutOfStock,
            price: p.price,
            moq: p.moq,
          }),
        });
        const resData = await response.json();
        return { id: p.id, success: response.ok && resData.success };
      } catch (err) {
        return { id: p.id, success: false, error: err.message };
      }
    })
  );

  return results;
}

/**
 * Fetch seller orders live from Supabase database
 */
export async function fetchSellerOrdersRequest() {
  const token = localStorage.getItem('auth_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/seller/orders`, { headers });
    const data = await response.json();

    if (response.ok && data.success && Array.isArray(data.orders)) {
      return data.orders;
    }
  } catch (err) {
    console.warn('Failed to fetch seller orders from backend API:', err.message);
  }

  return [];
}

/**
 * Update order status live in Supabase database
 */
export async function updateOrderStatusRequest(orderId, status) {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/seller/orders/${orderId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update order status in database.');
  }

  return data;
}

/**
 * Update order profitability values live in Supabase database
 */
export async function updateOrderProfitabilityRequest(orderId, fields) {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/seller/orders/${orderId}/profitability`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(fields),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update order profitability values.');
  }

  return data;
}

/**
 * Apply flat cost rules to all orders live in Supabase database
 */
export async function applyDefaultRatesRequest(defaultCogs, defaultFees, defaultShipping) {
  const token = localStorage.getItem('auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/seller/orders/apply-defaults`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ defaultCogs, defaultFees, defaultShipping }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to apply default cost rules.');
  }

  return data;
}
