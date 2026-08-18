const supabase = require('../src/config/supabase');

const API_BASE = 'http://127.0.0.1:5000/api';

async function runPasswordLifecycleTest() {
  console.log('====================================================');
  console.log('🧪 SELLER REGISTRATION WITH PASSWORD LIFECYCLE TEST');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const timestamp = Date.now();
  const testSellerEmail = `seller_pwd_verify_${timestamp}@laindain.org`;
  const customPassword = `CustomPass#${timestamp}!`;
  const testBizName = `Karachi Custom Mills ${timestamp}`;

  let createdUserId = null;

  try {
    // ----------------------------------------------------
    // STEP 1: Register Seller with Custom Password
    // ----------------------------------------------------
    console.log('--- STEP 1: Register Seller with Custom Password ---');
    console.log(`Email:    ${testSellerEmail}`);
    console.log(`Password: ${customPassword}`);

    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testSellerEmail,
        password: customPassword,
        role: 'SELLER',
        profileData: {
          business_name: testBizName,
          contact_number: '03211234567',
          business_address: 'Karachi, Pakistan',
          tax_id: '8877665-4',
        },
      }),
    });
    const regData = await regRes.json();

    assert(regRes.status === 201, `Registration status is 201 (Got: ${regRes.status})`);
    assert(regData.requireVerification === true, 'requireVerification is true');
    createdUserId = regData.user?.id;
    assert(Boolean(createdUserId), `Seller user ID generated: ${createdUserId}`);

    // Inspect user record in Supabase
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, password_hash, email_verification_token, is_email_verified')
      .eq('id', createdUserId)
      .single();

    assert(Boolean(dbUser), 'User found in database');
    assert(dbUser.is_email_verified === false, 'is_email_verified is false initially');
    const otpCode = dbUser.email_verification_token;
    assert(otpCode && otpCode.length === 6, `6-digit OTP stored in database: ${otpCode}`);

    // ----------------------------------------------------
    // STEP 2: Verify 6-Digit OTP Email Verification
    // ----------------------------------------------------
    console.log('\n--- STEP 2: Complete 6-Digit OTP Verification ---');
    const verifyRes = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testSellerEmail,
        code: otpCode,
      }),
    });
    const verifyData = await verifyRes.json();

    assert(verifyRes.status === 200, `OTP Verification status is 200 (Got: ${verifyRes.status})`);
    assert(verifyData.success === true, 'OTP Verification success is true');
    assert(verifyData.user.is_email_verified === true, 'user.is_email_verified is now true');

    // ----------------------------------------------------
    // STEP 3: Attempt Login (Must be blocked with 403 Pending Approval)
    // ----------------------------------------------------
    console.log('\n--- STEP 3: Verify Login Guard (Pending Admin Approval) ---');
    const preApproveLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testSellerEmail,
        password: customPassword,
      }),
    });
    const preApproveData = await preApproveLoginRes.json();

    assert(preApproveLoginRes.status === 403, `Login blocked with HTTP 403 (Got: ${preApproveLoginRes.status})`);
    assert(preApproveData.pendingApproval === true, 'Response contains pendingApproval: true');
    assert(preApproveData.token === undefined, 'No auth JWT token returned to unapproved seller');
    console.log('🛡️ Pending approval guard verified successfully.');

    // ----------------------------------------------------
    // STEP 4: Admin Logs In and Approves the Seller
    // ----------------------------------------------------
    console.log('\n--- STEP 4: Admin Approves Seller Application ---');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'laindaininterns@gmail.com',
        password: 'interns@LAINDAIN',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin authenticated successfully');

    const approveRes = await fetch(`${API_BASE}/admin/sellers/${createdUserId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminLoginData.token}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, `Seller status approved (Got: ${approveRes.status})`);
    console.log('👑 Admin approval confirmed.');

    // ----------------------------------------------------
    // STEP 5: Login with Custom Password After Approval
    // ----------------------------------------------------
    console.log('\n--- STEP 5: Seller Login with Custom Password After Approval ---');
    const postApproveLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testSellerEmail,
        password: customPassword,
      }),
    });
    const postApproveData = await postApproveLoginRes.json();

    assert(postApproveLoginRes.status === 200, `Login succeeded with 200 (Got: ${postApproveLoginRes.status})`);
    assert(postApproveData.success === true, 'Login success is true');
    assert(typeof postApproveData.token === 'string', 'Valid JWT session token returned');
    assert(postApproveData.user.role === 'SELLER', `Role is SELLER (Got: ${postApproveData.user.role})`);
    assert(postApproveData.profile.current_status === 'APPROVED', 'Profile status is APPROVED');
    console.log('🚀 Authenticated session verified with custom password.');

    // ----------------------------------------------------
    // STEP 6: Clean Up & Remove Test User from Database
    // ----------------------------------------------------
    console.log('\n--- STEP 6: Clean Up and Remove Test Seller from Database ---');
    await supabase.from('seller_profiles').delete().eq('user_id', createdUserId);
    const { data: deletedUser, error: delErr } = await supabase.from('users').delete().eq('id', createdUserId).select('*');

    assert(!delErr, `No delete error (Error: ${delErr ? delErr.message : 'none'})`);
    assert(deletedUser && deletedUser.length > 0, `Successfully removed test user (${testSellerEmail}) from database`);
    console.log('🗑️ Test user cleaned up completely from database.');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (createdUserId) {
      // Clean up in case of failure
      await supabase.from('seller_profiles').delete().eq('user_id', createdUserId);
      await supabase.from('users').delete().eq('id', createdUserId);
    }
    process.exit(1);
  }
}

runPasswordLifecycleTest().then(() => process.exit(0));
