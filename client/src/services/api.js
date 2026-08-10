const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Register a Buyer account in Supabase via backend API
 */
export async function registerBuyerRequest(formData) {
  try {
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

    return { name: formData.fullName || data.user.email.split('@')[0], email: data.user.email, role: data.user?.role, ...data };
  } catch (error) {
    console.warn('[API Fail-safe] registerBuyerRequest failed:', error.message);
    throw error;
  }
}

/**
 * Register a Seller account in Supabase via backend API
 */
export async function registerSellerRequest(formData) {
  try {
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

    return { refId, bizName: formData.bizName, role: data.user?.role, ...data };
  } catch (error) {
    console.warn('[API Fail-safe] registerSellerRequest failed:', error.message);
    throw error;
  }
}

/**
 * Login user via backend API
 */
export async function loginUserRequest(email, password) {
  try {
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

    return {
      name: displayName,
      email: data.user?.email || email,
      role: data.user?.role,
      ...data,
    };
  } catch (error) {
    console.warn('[API Fail-safe] loginUserRequest failed:', error.message);
    throw error;
  }
}

/**
 * Admin: Fetch pending seller profiles
 */
export async function fetchPendingSellers() {
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
    return data.sellers || [];
  } catch (error) {
    console.warn('[API Fail-safe] fetchPendingSellers failed:', error.message);
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
    return data.seller;
  } catch (error) {
    console.warn(`[API Fail-safe] updateSellerStatus (${status}) failed:`, error.message);
    throw error;
  }
}

/**
 * Seller: Fetch KYC status & documents
 */
export async function fetchSellerKyc() {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/seller/kyc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch seller KYC');
    }

    const data = await response.json();
    return data.kyc;
  } catch (error) {
    console.warn('[API Fail-safe] fetchSellerKyc failed:', error.message);
    throw error;
  }
}

/**
 * Seller: Upload / Submit KYC document
 */
export async function submitSellerKycDoc(docName) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/seller/kyc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ docName }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to upload document');
    }

    const data = await response.json();
    return data.document;
  } catch (error) {
    console.warn('[API Fail-safe] submitSellerKycDoc failed:', error.message);
    throw error;
  }
}

/**
 * Seller: Fetch seller products (Multi-Tenant Isolation)
 */
export async function fetchSellerProducts() {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/seller/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch seller products');
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.warn('[API Fail-safe] fetchSellerProducts failed:', error.message);
    throw error;
  }
}

/**
 * Seller: Create a new wholesale product
 */
export async function createSellerProductRequest(productData) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/seller/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to create product');
    }

    const data = await response.json();
    return data.product;
  } catch (error) {
    console.warn('[API Fail-safe] createSellerProductRequest failed:', error.message);
    throw error;
  }
}

/**
 * Seller: Update product stock quantity or out-of-stock toggle
 */
export async function updateSellerStockRequest(productId, stockData) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/seller/products/${productId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(stockData),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to update product stock');
    }

    const data = await response.json();
    return data.product;
  } catch (error) {
    console.warn('[API Fail-safe] updateSellerStockRequest failed:', error.message);
    throw error;
  }
}

/**
 * Seller: Fetch purchase orders
 */
export async function fetchSellerOrders() {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/seller/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to fetch seller orders');
    }

    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.warn('[API Fail-safe] fetchSellerOrders failed:', error.message);
    throw error;
  }
}

/**
 * Seller: Update purchase order status
 */
export async function updateSellerOrderStatusRequest(orderId, status) {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/seller/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to update order status');
    }

    const data = await response.json();
    return data.order;
  } catch (error) {
    console.warn('[API Fail-safe] updateSellerOrderStatusRequest failed:', error.message);
    throw error;
  }
}
