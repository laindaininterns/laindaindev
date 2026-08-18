const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { JWT_SECRET } = require('../middleware/auth');
const { sendWelcomeEmail, sendVerificationCode, sendPasswordResetEmail } = require('../services/emailService');
const AccountMergeService = require('../services/accountMergeService');
const BuyerProfileService = require('../services/buyerProfileService');

/**
 * Generate a 6-digit numeric OTP code for email verification
 */
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

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

    // BUYER: Auto-verified on signup. SELLER/ADMIN: Require 6-digit OTP verification code.
    const isBuyer = normalizedRole === 'BUYER';
    const isEmailVerified = isBuyer;
    const verificationCode = isBuyer ? null : generateVerificationCode();

    // Insert core user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash,
          role: normalizedRole,
          is_email_verified: isEmailVerified,
          email_verification_token: verificationCode,
        },
      ])
      .select('id, email, role, is_email_verified, created_at')
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
    let displayName = profileData.full_name || profileData.fullName || profileData.business_name || null;

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
            contact_number: profileData.contact_number || profileData.phone || null,
            billing_address: profileData.billing_address || null,
            shipping_address: profileData.shipping_address || profileData.address || null,
          },
        ])
        .select('*')
        .single();
      if (buyerErr) throw buyerErr;
      profileResult = buyerProfile;
      profileId = buyerProfile.id;
    } else if (normalizedRole === 'SELLER') {
      const businessName = profileData.business_name || 'Pending Business';
      displayName = businessName;
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
    }

    // Dispatch general Welcome Email for EVERYONE (BUYER & SELLER)
    try {
      await sendWelcomeEmail({
        email: user.email,
        name: displayName,
        role: normalizedRole,
      });
    } catch (emailErr) {
      console.warn('[Registration Warning] Welcome email dispatch failed:', emailErr.message);
    }

    // Trigger OTP Verification Code for accounts requiring verification (e.g. SELLER)
    if (!isEmailVerified && verificationCode) {
      console.log('\n=============================================');
      console.log('🔑 [DEV] SELLER OTP CODE:', verificationCode);
      console.log('=============================================\n');
      try {
        await sendVerificationCode(user.email, verificationCode);
      } catch (emailErr) {
        console.warn('[Registration Warning] Email OTP verification dispatch failed:', emailErr.message);
      }
    }

    // Merge guest cart & guest orders for BUYER if applicable
    if (normalizedRole === 'BUYER' && profileId) {
      const incomingGuestId = req.headers['x-guest-id'] || req.headers['x-guest-token'] || (req.body && req.body.guest_id);
      const phone = profileData.phone_number || profileData.contact_number || profileData.phone || null;
      try {
        await AccountMergeService.mergeGuestDataToAccount({
          guestId: incomingGuestId,
          buyerProfileId: profileId,
          email: user.email,
          phone,
        });
      } catch (mergeErr) {
        console.error('Registration account merge error:', mergeErr.message);
      }
    }

    // If account requires OTP verification, do NOT issue JWT session token yet
    if (!isEmailVerified) {
      return res.status(201).json({
        success: true,
        requireVerification: true,
        email: user.email,
        message: `${normalizedRole} registered successfully. Verification code dispatched to email.`,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          is_email_verified: false,
          profile_id: profileId,
          created_at: user.created_at,
        },
      });
    }

    // BUYER / Verified Account: Issue session JWT token immediately
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
        is_email_verified: true,
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
 * POST /api/auth/verify-email
 * Accepts email & 6-digit code or otp to validate user and flip is_email_verified to true
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, code, otp } = req.body;
    const verificationCode = String(code || otp || '').trim();

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, role, is_email_verified, email_verification_token')
      .ilike('email', normalizedEmail)
      .single();

    if (findError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (user.is_email_verified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified.',
        user,
      });
    }

    if (user.email_verification_token !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please enter the correct 6-digit OTP sent to your email.',
      });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        is_email_verified: true,
        email_verification_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('id, email, role, is_email_verified, updated_at')
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update email verification status.',
        error: updateError.message,
      });
    }

    console.log(`[OTP Verification] User email verified successfully: ${updatedUser.email} (Role: ${updatedUser.role})`);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during email verification.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/resend-otp
 * Generates and dispatches a fresh 6-digit OTP code to the seller's email
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, role, is_email_verified')
      .ilike('email', normalizedEmail)
      .single();

    if (findError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (user.is_email_verified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified.',
      });
    }

    const verificationCode = generateVerificationCode();

    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verification_token: verificationCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate new verification code.',
        error: updateError.message,
      });
    }

    console.log('\n=============================================');
    console.log('🔑 [DEV] SELLER OTP CODE:', verificationCode);
    console.log('=============================================\n');

    try {
      await sendVerificationCode(user.email, verificationCode);
    } catch (emailErr) {
      console.warn('[Resend OTP Warning] Email dispatch failed:', emailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'A fresh 6-digit verification code has been dispatched to your email.',
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error resending verification code.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/login
 * Validates email, compares password using bcryptjs, and returns JWT
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

    const normalizedEmail = email.trim().toLowerCase();

    // Query user by email (case-insensitive)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', normalizedEmail)
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

    // Enforce OTP verification ONLY if user is a SELLER with unverified email
    if (user.role === 'SELLER' && user.is_email_verified === false) {
      return res.status(403).json({
        success: false,
        requireVerification: true,
        email: user.email,
        message: 'Email verification required. Please enter the 6-digit OTP sent to your email.',
      });
    }

    // Auto-verify BUYER or ADMIN if is_email_verified is currently false
    if ((user.role === 'BUYER' || user.role === 'ADMIN') && user.is_email_verified === false) {
      try {
        await supabase
          .from('users')
          .update({ is_email_verified: true, email_verification_token: null, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        user.is_email_verified = true;
      } catch (autoVerifyErr) {
        console.warn('[Login Auto-Verify] Warning:', autoVerifyErr.message);
      }
    }

    // Fetch profile id based on role
    let profileId = null;
    let profileData = null;

    if (user.role === 'ADMIN') {
      let { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (!adminProfile) {
        const { data: newAdminProfile } = await supabase
          .from('admin_profiles')
          .insert([{ user_id: user.id }])
          .select('*')
          .single();
        adminProfile = newAdminProfile;
      }
      if (adminProfile) {
        profileId = adminProfile.id;
        profileData = adminProfile;
      }
    } else if (user.role === 'BUYER') {
      let { data: buyerProfile } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (!buyerProfile) {
        buyerProfile = await BuyerProfileService.createProfile(user.id);
      }
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
      if (!sellerProfile || sellerProfile.current_status !== 'APPROVED') {
        return res.status(403).json({
          success: false,
          pendingApproval: true,
          currentStatus: sellerProfile ? sellerProfile.current_status : 'PENDING',
          message: 'Your seller account is pending admin approval. You will receive an email once approved.',
        });
      }
      profileId = sellerProfile.id;
      profileData = sellerProfile;
    }

    // Merge guest cart & guest orders upon login if buyer profile is active
    if (profileId && (user.role === 'BUYER' || profileData)) {
      const incomingGuestId = req.headers['x-guest-id'] || req.headers['x-guest-token'] || (req.body && req.body.guest_id);
      const phone = profileData ? (profileData.phone_number || profileData.contact_number) : null;
      try {
        await AccountMergeService.mergeGuestDataToAccount({
          guestId: incomingGuestId,
          buyerProfileId: profileId,
          email: user.email,
          phone,
        });
      } catch (mergeErr) {
        console.error('Login account merge error:', mergeErr.message);
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
        is_email_verified: user.is_email_verified,
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
      const verificationCode = generateVerificationCode();

      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert([
          {
            email,
            password_hash,
            role: 'SELLER',
            is_email_verified: false,
            email_verification_token: verificationCode,
          },
        ])
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

      console.log('\n=============================================');
      console.log('🔑 [DEV] SELLER OTP CODE:', verificationCode);
      console.log('=============================================\n');

      await sendVerificationCode(newUser.email, verificationCode);
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

/**
 * POST /api/auth/forgot-password
 * Accepts email, looks up user in database, generates reset token, and dispatches Resend password reset email
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query base users table by email (case-insensitive) regardless of role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .ilike('email', normalizedEmail)
      .single();

    if (userError || !user) {
      console.log(`[Forgot Password] User lookup missing for: ${normalizedEmail}`);
      // For security, return success to prevent user email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.',
      });
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    console.log('\n=============================================');
    if (user.role === 'ADMIN') {
      console.log(`🔗 [DEV] ADMIN PASSWORD RESET LINK: ${resetLink}`);
    } else {
      console.log(`🔗 [DEV] PASSWORD RESET LINK: ${resetLink}`);
    }
    console.log('=============================================\n');

    // Dispatch Resend email
    const emailResult = await sendPasswordResetEmail({
      email: user.email,
      resetToken,
      resetLink,
    });

    console.log(`[Forgot Password] Reset email dispatched for ${user.email}:`, emailResult);

    return res.status(200).json({
      success: true,
      message: 'Password reset link has been dispatched to your email address.',
    });
  } catch (error) {
    console.error('Error in forgotPassword handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during password reset request.',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/reset-password
 * Verifies password reset JWT token, hashes new password using bcryptjs, and updates user record
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    // Verify reset JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link. Please request a new link.',
      });
    }

    if (decoded.type !== 'password_reset' || !decoded.id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password reset token format.',
      });
    }

    // Hash new password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update password & auto-verify email in Supabase database
    const { data: updatedUser, error: updateErr } = await supabase
      .from('users')
      .update({
        password_hash,
        is_email_verified: true,
        email_verification_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', decoded.id)
      .select('id, email, role, is_email_verified, updated_at')
      .single();

    if (updateErr || !updatedUser) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update password.',
        error: updateErr ? updateErr.message : 'User not found.',
      });
    }

    console.log(`[Reset Password] Password successfully reset for user: ${updatedUser.email}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Error in resetPassword handler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during password reset.',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  submitSellerApplication,
};
