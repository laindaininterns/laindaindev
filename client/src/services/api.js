export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');


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
 * Admin: Fetch pending seller profiles
 */
export async function fetchPendingSellers(forceRefresh = false) {
  if (!forceRefresh && apiCache.pendingSellers.data && (Date.now() - apiCache.pendingSellers.timestamp) < CACHE_TTL_MS) {
    return apiCache.pendingSellers.data;
  }
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/admin/sellers/pending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Server returned status ${response.status}`);
    }

    const data = await response.json();
    const result = data.sellers || [];
    apiCache.pendingSellers = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.warn('[API Fail-safe] fetchPendingSellers failed:', error.message);
    if (apiCache.pendingSellers.data) return apiCache.pendingSellers.data;
    throw error;
  }
}

/**
 * Admin: Update seller verification status
 */
export async function updateSellerStatus(sellerId, status) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/admin/sellers/${sellerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Server returned status ${response.status}`);
    }

    const data = await response.json();
    clearAdminApiCache();
    return data.seller;
  } catch (error) {
    console.warn(`[API Fail-safe] updateSellerStatus (${status}) failed:`, error.message);
    throw error;
  }
}

/**
 * Fetch products live from Supabase database via backend API (Seller)
 */
export async function fetchSellerProductsRequest() {
  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      const response = await fetch(`${API_BASE_URL}/seller/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          return data.products.map((p) => ({
            id: p.id,
            name: p.title || p.name,
            sku: p.sku || `TX-${String(p.id).substring(0, 4).toUpperCase()}`,
            cat: p.categories?.name || p.cat || 'Clothing & Apparel',
            price: parseFloat(p.price),
            stock: p.stock_quantity !== undefined ? p.stock_quantity : (p.stock || 0),
            isOutOfStock: p.is_out_of_stock !== undefined ? p.is_out_of_stock : (p.stock === 0),
            moq: p.moq || 10,
            desc: p.description || p.desc || '',
            photos: p.images && p.images.length > 0 ? p.images : (p.photos || []),
            image: p.image || (p.images && p.images[0]) || (p.photos && p.photos[0]),
          }));
        }
      }
    } catch (err) {
      console.warn('Seller API endpoint error, falling back to public feed:', err.message);
    }
  }

  // Fallback to public products endpoint
  try {
    const res2 = await fetch(`${API_BASE_URL}/products`);
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.success && Array.isArray(data2.products) && data2.products.length > 0) {
        return data2.products.map((p) => ({
          id: p.id,
          name: p.title || p.name,
          sku: p.sku || `TX-${String(p.id).substring(0, 4).toUpperCase()}`,
          cat: p.categories?.name || p.cat || 'Clothing & Apparel',
          price: parseFloat(p.price),
          stock: p.stock_quantity !== undefined ? p.stock_quantity : (p.stock || 0),
          isOutOfStock: p.is_out_of_stock !== undefined ? p.is_out_of_stock : (p.stock === 0),
          moq: p.moq || 10,
          desc: p.description || p.desc || '',
          photos: p.images && p.images.length > 0 ? p.images : (p.photos || []),
          image: p.image || (p.images && p.images[0]) || (p.photos && p.photos[0]),
        }));
      }
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

export const createSellerProductRequest = createProductRequest;
export const fetchSellerProducts = fetchSellerProductsRequest;



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

// In-memory cache for ultra-fast instant admin dashboard tab switching
const apiCache = {
  adminSummary: { data: null, timestamp: 0 },
  allSellers: { data: null, timestamp: 0 },
  pendingSellers: { data: null, timestamp: 0 },
  buyersDirectory: { data: null, timestamp: 0 },
  adminProductsCatalog: { data: null, timestamp: 0 },
};

const CACHE_TTL_MS = 60000; // 60 seconds

export function clearAdminApiCache() {
  Object.keys(apiCache).forEach((k) => {
    apiCache[k] = { data: null, timestamp: 0 };
  });
}

/**
 * Admin: Fetch Buyers Directory
 */
export async function fetchBuyersDirectory(forceRefresh = false) {
  if (!forceRefresh && apiCache.buyersDirectory.data && (Date.now() - apiCache.buyersDirectory.timestamp) < CACHE_TTL_MS) {
    return apiCache.buyersDirectory.data;
  }
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/admin/buyers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch buyers directory');
    }

    const data = await response.json();
    const result = data.buyers || [];
    apiCache.buyersDirectory = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.warn('[API Fail-safe] fetchBuyersDirectory failed:', error.message);
    if (apiCache.buyersDirectory.data) return apiCache.buyersDirectory.data;
    throw error;
  }
}

/**
 * Admin: Fetch All Marketplace Orders
 */
export async function fetchAdminOrders(statusFilter) {
  try {
    const token = localStorage.getItem('auth_token');
    const url = statusFilter ? `${API_BASE_URL}/admin/orders?status=${statusFilter}` : `${API_BASE_URL}/admin/orders`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch admin orders');
    }

    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.warn('[API Fail-safe] fetchAdminOrders failed:', error.message);
    throw error;
  }
}

/**
 * Admin: Update Global Order Status & Logistics Tracking
 */
export async function updateAdminOrderLogistics(orderId, logisticsData) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(logisticsData),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to update order logistics');
    }

    const data = await response.json();
    clearAdminApiCache();
    return data.order;
  } catch (error) {
    console.warn('[API Fail-safe] updateAdminOrderLogistics failed:', error.message);
    throw error;
  }
}

/**
 * Admin: Fetch All Sellers Directory (Verified, Pending, Rejected)
 */
export async function fetchAllSellers(forceRefresh = false) {
  if (!forceRefresh && apiCache.allSellers.data && (Date.now() - apiCache.allSellers.timestamp) < CACHE_TTL_MS) {
    return apiCache.allSellers.data;
  }
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/admin/sellers/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch all sellers directory');
    }

    const data = await response.json();
    const result = data.sellers || [];
    apiCache.allSellers = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.warn('[API Fail-safe] fetchAllSellers failed:', error.message);
    if (apiCache.allSellers.data) return apiCache.allSellers.data;
    throw error;
  }
}

/**
 * Admin: Fetch Live Dashboard Summary Metrics
 */
export async function fetchAdminSummary(forceRefresh = false) {
  if (!forceRefresh && apiCache.adminSummary.data && (Date.now() - apiCache.adminSummary.timestamp) < CACHE_TTL_MS) {
    return apiCache.adminSummary.data;
  }
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/admin/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch admin summary metrics');
    }

    const data = await response.json();
    apiCache.adminSummary = { data, timestamp: Date.now() };
    return data;
  } catch (error) {
    console.warn('[API Fail-safe] fetchAdminSummary failed:', error.message);
    if (apiCache.adminSummary.data) return apiCache.adminSummary.data;
    throw error;
  }
}

/**
 * Admin: Fetch Wholesale Catalog Products
 */
export async function fetchAdminProductsCatalog(forceRefresh = false) {
  if (!forceRefresh && apiCache.adminProductsCatalog.data && (Date.now() - apiCache.adminProductsCatalog.timestamp) < CACHE_TTL_MS) {
    return apiCache.adminProductsCatalog.data;
  }
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/admin/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch admin products catalog');
    }

    const data = await response.json();
    const result = data.products || [];
    apiCache.adminProductsCatalog = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.warn('[API Fail-safe] fetchAdminProductsCatalog failed:', error.message);
    if (apiCache.adminProductsCatalog.data) return apiCache.adminProductsCatalog.data;
    throw error;
  }
}



