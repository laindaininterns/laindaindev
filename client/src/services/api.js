const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:5000/api' : 'https://laindaindev.onrender.com/api');

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
        full_name: formData.fullName,
        contact_number: formData.bizPhone || null,
        billing_address: formData.bizAddress || null,
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
  // Use default or provided password
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

  // Extract real display name from profile object:
  // - BUYER: profile.full_name
  // - SELLER: profile.business_name
  // - Fallback: email username before @
  const displayName =
    data.profile?.full_name ||
    data.profile?.business_name ||
    data.profile?.billing_address ||
    (data.user?.email ? data.user.email.split('@')[0] : email.split('@')[0]);

  return { name: displayName, email: data.user?.email || email, role: data.user?.role, ...data };
}

/**
 * Fetch authenticated user profile details from backend API
 */
export async function getUserProfile() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found. Please sign in again.');
  }

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch user profile.');
  }

  return data;
}

/**
 * Update authenticated user profile details via backend API
 */
export async function updateUserProfile(profileData) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found. Please sign in again.');
  }

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to update user profile.');
  }

  return data;
}

