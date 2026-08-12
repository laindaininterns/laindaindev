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
