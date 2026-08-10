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
 * Fetch pending seller profiles for Admin Approvals queue
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
 * Update seller verification status (APPROVED or REJECTED)
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
