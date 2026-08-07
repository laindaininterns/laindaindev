const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://laindaindev.onrender.com/api';

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

  let displayName = email.split('@')[0];
  if (data.profile) {
    if (data.profile.billing_address) {
      displayName = data.profile.billing_address;
    } else if (data.profile.business_name) {
      displayName = data.profile.business_name;
    }
  }

  return {
    name: displayName,
    email: data.user?.email || email,
    role: data.user?.role,
    ...data,
  };
}
