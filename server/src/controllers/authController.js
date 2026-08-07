const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { JWT_SECRET } = require('../middleware/auth');
const { sendSellerWelcomeEmail } = require('../services/emailService');

/**
 * POST /api/auth/register
 * Handles registration logic, hashes password, inserts into users, and creates matching profile
 */
const register = async (req, res) => {
  try {
    const { email, password, role = 'BUYER', profileData = {} } = req.body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format.',
      });
    }

    const normalizedRole = role.toUpperCase();
    if (!['ADMIN', 'BUYER', 'SELLER'].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Valid roles: ADMIN, BUYER, SELLER.',
      });
    }

    // Check if user with this email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // Hash password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert core user
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

    if (userError || !user) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create user account.',
        error: userError ? userError.message : 'Unknown database error',
      });
    }

    let profileResult = null;
    let profileId = null;

    if (normalizedRole === 'ADMIN') {
      const { data: adminProfile, error: adminErr } = await supabase
        .from('admin_profiles')
        .insert([{ user_id: user.id }])
        .select('*')
        .single();
      if (adminErr) throw adminErr;
      profileResult = adminProfile;
      profileId = adminProfile.id;
    } else if (normalizedRole === 'BUYER') {
      const { data: buyerProfile, error: buyerErr } = await supabase
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
      if (buyerErr) throw buyerErr;
      profileResult = buyerProfile;
      profileId = buyerProfile.id;
    } else if (normalizedRole === 'SELLER') {
      const businessName = profileData.business_name || 'Pending Business';
      const { data: sellerProfile, error: sellerErr } = await supabase
        .from('seller_profiles')
        .insert([
          {
            user_id: user.id,
            business_name: businessName,
            business_address: profileData.business_address || null,
            tax_id: profileData.tax_id || null,
            current_status: 'PENDING',
          },
        ])
        .select('*')
        .single();
      if (sellerErr) throw sellerErr;
      profileResult = sellerProfile;
      profileId = sellerProfile.id;

      // Trigger welcome email via resend upon seller registration
      await sendSellerWelcomeEmail({
        email: user.email,
        businessName: sellerProfile.business_name,
      });
    }

    // Generate JWT token including user id, role, email, and profile_id
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        profile_id: profileId,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: `${normalizedRole} registered successfully.`,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile_id: profileId,
        created_at: user.created_at,
      },
      profile: profileResult,
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/login
 * Validates email, compares password using bcryptjs, and returns JWT signed with user id, role, and profile id
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format.',
      });
    }

    // Query user by email
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

    // Compare password using bcryptjs
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Fetch profile id based on role
    let profileId = null;
    let profileData = null;

    if (user.role === 'ADMIN') {
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (adminProfile) {
        profileId = adminProfile.id;
        profileData = adminProfile;
      }
    } else if (user.role === 'BUYER') {
      const { data: buyerProfile } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (buyerProfile) {
        profileId = buyerProfile.id;
        profileData = buyerProfile;
      }
    } else if (user.role === 'SELLER') {
      const { data: sellerProfile } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (sellerProfile) {
        profileId = sellerProfile.id;
        profileData = sellerProfile;
      }
    }

    // Generate JWT token with user id, email, role, and profile_id
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        profile_id: profileId,
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
        profile_id: profileId,
      },
      profile: profileData,
    });
  } catch (error) {
    console.error('Error during login:', error);
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
    const { email, password, business_name, business_address, tax_id, contact_number } = req.body;

    if (!email || !business_name) {
      return res.status(400).json({
        success: false,
        message: 'Email and business name are required.',
      });
    }

    // Register seller if password provided, or register seller application
    let userResult = null;
    let sellerProfileResult = null;

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (!existingUser) {
      const userPassword = password || 'DefaultPass123!';
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(userPassword, salt);

      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert([{ email, password_hash, role: 'SELLER' }])
        .select('id, email, role, created_at')
        .single();

      if (createErr) throw createErr;
      userResult = newUser;

      const { data: newSellerProfile, error: profErr } = await supabase
        .from('seller_profiles')
        .insert([
          {
            user_id: newUser.id,
            business_name,
            business_address: business_address || null,
            tax_id: tax_id || null,
            current_status: 'PENDING',
          },
        ])
        .select('*')
        .single();

      if (profErr) throw profErr;
      sellerProfileResult = newSellerProfile;
    } else {
      userResult = existingUser;
      const { data: existingProfile } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', existingUser.id)
        .single();

      if (existingProfile) {
        sellerProfileResult = existingProfile;
      } else {
        const { data: newProfile, error: pErr } = await supabase
          .from('seller_profiles')
          .insert([
            {
              user_id: existingUser.id,
              business_name,
              business_address: business_address || null,
              tax_id: tax_id || null,
              current_status: 'PENDING',
            },
          ])
          .select('*')
          .single();
        if (pErr) throw pErr;
        sellerProfileResult = newProfile;
      }
    }

    // Send welcome email to applicant
    await sendSellerWelcomeEmail({
      email: userResult.email,
      businessName: sellerProfileResult.business_name,
    });

    return res.status(200).json({
      success: true,
      message: 'Seller application submitted successfully and is pending approval.',
      application: {
        seller_profile_id: sellerProfileResult.id,
        user_id: userResult.id,
        business_name: sellerProfileResult.business_name,
        business_address: sellerProfileResult.business_address,
        tax_id: sellerProfileResult.tax_id,
        email: userResult.email,
        status: sellerProfileResult.current_status,
      },
    });
  } catch (error) {
    console.error('Error submitting seller application:', error);
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
