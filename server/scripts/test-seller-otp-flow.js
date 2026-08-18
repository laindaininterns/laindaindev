const supabase = require('../src/config/supabase');

const API_BASE = 'http://127.0.0.1:5000/api';

async function runSellerOtpFlowTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING SELLER REGISTRATION & 6-DIGIT OTP FLOW TESTS');
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
  const testSellerEmail = `seller_otp_test_${timestamp}@laindain.org`;
  const testPassword = 'SellerTestPass123!';
  const testBizName = `Lahore Crafts ${timestamp}`;

  try {
    // ----------------------------------------------------
    // TEST 1: Register Seller via POST /api/auth/register
    // ----------------------------------------------------
    console.log('--- TEST 1: Register Seller Account ---');
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testSellerEmail,
        password: testPassword,
        role: 'SELLER',
        profileData: {
          business_name: testBizName,
          contact_number: '03001234567',
          business_address: 'Faisalabad, Pakistan',
          tax_id: '1234567-8',
        },
      }),
    });
    const registerData = await registerRes.json();

    assert(registerRes.status === 201, `Registration returns HTTP 201 (Got: ${registerRes.status})`);
    assert(registerData.success === true, 'Registration success is true');
    assert(registerData.requireVerification === true, 'Registration returns requireVerification: true');
    assert(registerData.user.is_email_verified === false, 'is_email_verified is false initially');
    assert(registerData.token === undefined, 'No JWT token issued prior to OTP verification');
    console.log(`👤 Seller registered: ${testSellerEmail}\n`);

    // Fetch user record from Supabase to inspect token
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, role, is_email_verified, email_verification_token')
      .eq('email', testSellerEmail)
      .single();

    assert(Boolean(dbUser), 'User record exists in Supabase');
    assert(dbUser.email_verification_token && dbUser.email_verification_token.length === 6, `6-digit OTP stored in DB (Token: ${dbUser.email_verification_token})`);

    // ----------------------------------------------------
    // TEST 2: Attempt verification with incorrect OTP code
    // ----------------------------------------------------
    console.log('--- TEST 2: Verification with Incorrect OTP ---');
    const badVerifyRes = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testSellerEmail,
        code: '000000',
      }),
    });
    assert(badVerifyRes.status === 400, `Incorrect OTP rejected with HTTP 400 (Got: ${badVerifyRes.status})`);

    // ----------------------------------------------------
    // TEST 3: Resend OTP Code via POST /api/auth/resend-otp
    // ----------------------------------------------------
    console.log('--- TEST 3: Resend OTP Code ---');
    const resendRes = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testSellerEmail }),
    });
    const resendData = await resendRes.json();

    assert(resendRes.status === 200, `Resend OTP returns HTTP 200 (Got: ${resendRes.status})`);
    assert(resendData.success === true, 'Resend response returns success: true');

    // Get fresh token from DB
    const { data: freshUser } = await supabase
      .from('users')
      .select('email_verification_token')
      .eq('email', testSellerEmail)
      .single();

    const currentOtp = freshUser.email_verification_token;
    assert(currentOtp && currentOtp.length === 6, `Fresh 6-digit OTP present (Token: ${currentOtp})`);
    console.log(`📬 Resend OTP verified with fresh token: ${currentOtp}\n`);

    // ----------------------------------------------------
    // TEST 4: Execute Valid OTP Verification via POST /api/auth/verify-email
    // ----------------------------------------------------
    console.log('--- TEST 4: Submit Correct 6-Digit OTP ---');
    const verifyRes = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testSellerEmail,
        otp: currentOtp,
      }),
    });
    const verifyData = await verifyRes.json();

    assert(verifyRes.status === 200, `Verification returns HTTP 200 (Got: ${verifyRes.status})`);
    assert(verifyData.success === true, 'Verification success is true');
    assert(verifyData.user.is_email_verified === true, 'user.is_email_verified is now true');

    // Verify DB state
    const { data: verifiedUser } = await supabase
      .from('users')
      .select('is_email_verified, email_verification_token')
      .eq('email', testSellerEmail)
      .single();

    assert(verifiedUser.is_email_verified === true, 'Database has is_email_verified = true');
    assert(verifiedUser.email_verification_token === null, 'email_verification_token cleared from database');

    const { data: sellerProf } = await supabase
      .from('seller_profiles')
      .select('current_status')
      .eq('user_id', dbUser.id)
      .single();

    assert(sellerProf.current_status === 'PENDING', `Seller profile status is preserved as PENDING (Got: ${sellerProf.current_status})`);
    console.log('🎉 OTP verified and seller preserved in PENDING state.\n');

    // ----------------------------------------------------
    // TEST 5: Verify Login Remains Blocked Prior to Admin Approval
    // ----------------------------------------------------
    console.log('--- TEST 5: Seller Login Guard Check (Pending Approval) ---');
    const loginAttemptRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testSellerEmail,
        password: testPassword,
      }),
    });
    const loginAttemptData = await loginAttemptRes.json();

    assert(loginAttemptRes.status === 403, `Pending seller login blocked with HTTP 403 (Got: ${loginAttemptRes.status})`);
    assert(loginAttemptData.pendingApproval === true, 'Login response has pendingApproval: true');
    assert(loginAttemptData.token === undefined, 'No auth JWT token returned while pending approval');
    console.log('🛡️ Auth Guard verified: Pending seller cannot log in.\n');

    // ----------------------------------------------------
    // TEST 6: Admin Approves Seller -> Seller Can Log In
    // ----------------------------------------------------
    console.log('--- TEST 6: Admin Approval & Subsequent Seller Login ---');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'laindaininterns@gmail.com',
        password: 'interns@LAINDAIN',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    console.log('Admin login status:', adminLoginRes.status, 'Data:', adminLoginData);
    assert(adminLoginRes.status === 200, `Admin logs in successfully (Got: ${adminLoginRes.status})`);

    // Approve the seller via Admin API
    const approveRes = await fetch(`${API_BASE}/admin/sellers/${dbUser.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminLoginData.token}`,
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert(approveRes.status === 200, `Admin approves seller with HTTP 200 (Got: ${approveRes.status})`);

    // Now seller logs in
    const approvedLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testSellerEmail,
        password: testPassword,
      }),
    });
    const approvedLoginData = await approvedLoginRes.json();

    assert(approvedLoginRes.status === 200, `Approved seller logs in with HTTP 200 (Got: ${approvedLoginRes.status})`);
    assert(approvedLoginData.success === true, 'Approved login success: true');
    assert(typeof approvedLoginData.token === 'string', 'JWT token successfully issued to approved seller');
    assert(approvedLoginData.user.role === 'SELLER', 'User role is SELLER');
    console.log('🎉 Full End-to-End Seller Lifecycle Verified Successfully!\n');

    console.log('----------------------------------------------------');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
}

runSellerOtpFlowTests().then(() => process.exit(0));
