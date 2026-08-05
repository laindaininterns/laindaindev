const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Handles registration logic and generates different profiles based on user role (ADMIN, BUYER, SELLER).
 */
const register = async (req, res) => {
  try {
    const { email, password, role = 'BUYER', profileData = {} } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedRole = role.toUpperCase();
    if (!['ADMIN', 'BUYER', 'SELLER'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Valid roles: ADMIN, BUYER, SELLER.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create core user record in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash,
          role: normalizedRole,
        },
      ])
      .select('id, email, role, created_at')
      .single();

    if (userError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create user account.',
        error: userError.message,
      });
    }

    // Scaffold profile creation based on role
    let profileResult = null;
    if (normalizedRole === 'ADMIN') {
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .insert([{ user_id: user.id }])
        .select('*')
        .single();
      profileResult = adminProfile;
    } else if (normalizedRole === 'BUYER') {
      const { data: buyerProfile } = await supabase
        .from('buyer_profiles')
        .insert([
          {
            user_id: user.id,
            contact_number: profileData.contact_number || null,
            billing_address: profileData.billing_address || null,
            shipping_address: profileData.shipping_address || null,
          },
        ])
        .select('*')
        .single();
      profileResult = buyerProfile;
    } else if (normalizedRole === 'SELLER') {
      const { data: sellerProfile } = await supabase
        .from('seller_profiles')
        .insert([
          {
            user_id: user.id,
            business_name: profileData.business_name || 'Pending Business',
            business_address: profileData.business_address || null,
            tax_id: profileData.tax_id || null,
            current_status: 'PENDING',
          },
        ])
        .select('*')
        .single();
      profileResult = sellerProfile;
    }

    return res.status(201).json({
      success: true,
      message: `${normalizedRole} registered successfully.`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      profile: profileResult,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/login
 * Standard JWT issuing for all 3 roles (ADMIN, BUYER, SELLER).
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Fetch user from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/seller/submit_application
 * Handles seller application submission (Flow 4 of storyboard)
 */
const submitSellerApplication = async (req, res) => {
  try {
    const { business_name, business_address, tax_id, email, contact_number } = req.body;

    if (!business_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Business name and contact email are required.',
      });
    }

    // Process seller application submission logic
    return res.status(200).json({
      success: true,
      message: 'Seller application submitted successfully and is pending approval.',
      application: {
        business_name,
        business_address,
        tax_id,
        email,
        contact_number,
        status: 'PENDING',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error submitting seller application.',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  submitSellerApplication,
};
