const jwt = require('jsonwebtoken');

const API_BASE = 'http://127.0.0.1:5000/api';
const ADMIN_EMAIL = 'laindaininterns@gmail.com';
const ADMIN_PASSWORD = 'interns@LAINDAIN';
const TEMP_PASSWORD = 'interns@LAINDAIN_RESET_TEST';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING ADMIN AUTH & FORGOT PASSWORD FLOW TESTS');
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

  try {
    // ----------------------------------------------------
    // TEST 1: Initial Login with Seeded Admin Credentials
    // ----------------------------------------------------
    console.log('--- TEST 1: Admin Login with Seeded Credentials ---');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const loginData = await loginRes.json();

    assert(loginRes.status === 200, `Login response status is 200 (Got: ${loginRes.status})`);
    assert(loginData.success === true, 'Login response returns success: true');
    assert(typeof loginData.token === 'string', 'JWT token is returned in response');
    assert(loginData.user.role === 'ADMIN', `User role in response is ADMIN (Got: ${loginData.user.role})`);
    assert(loginData.user.email.toLowerCase() === ADMIN_EMAIL, `Email matches (Got: ${loginData.user.email})`);
    assert(loginData.user.is_email_verified === true, 'Admin account is_email_verified is true');

    const adminJwt = loginData.token;
    console.log('🔑 Received Admin JWT token successfully.\n');

    // ----------------------------------------------------
    // TEST 2: Protected Admin Route Access with JWT
    // ----------------------------------------------------
    console.log('--- TEST 2: Access Protected Admin Route (GET /api/admin/summary) ---');
    const adminSummaryRes = await fetch(`${API_BASE}/admin/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminJwt}`,
      },
    });
    const adminSummaryData = await adminSummaryRes.json();

    assert(adminSummaryRes.status === 200, `Admin summary status is 200 (Got: ${adminSummaryRes.status})`);
    assert(adminSummaryData.success === true, 'Admin summary returns success: true');
    console.log('📊 Admin summary metrics verified successfully.\n');

    // ----------------------------------------------------
    // TEST 3: Admin Forgot-Password Request (Case-Insensitive)
    // ----------------------------------------------------
    console.log('--- TEST 3: Forgot Password Request (Case-Insensitive Email) ---');
    const mixedCaseEmail = 'LainDainInterns@Gmail.Com';
    const forgotRes = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mixedCaseEmail }),
    });
    const forgotData = await forgotRes.json();

    assert(forgotRes.status === 200, `Forgot password status is 200 (Got: ${forgotRes.status})`);
    assert(forgotData.success === true, 'Forgot password returns success: true');
    console.log('📬 Forgot password link triggered successfully.\n');

    // ----------------------------------------------------
    // TEST 4: Generate Reset Token & Perform Password Reset
    // ----------------------------------------------------
    console.log('--- TEST 4: Reset Password Execution ---');
    // Create a valid signed token for the admin user ID
    const JWT_SECRET = process.env.JWT_SECRET || 'lain-dain-jwt-secret-key-change-in-prod';
    const resetToken = jwt.sign(
      { id: loginData.user.id, email: ADMIN_EMAIL, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const resetRes = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, newPassword: TEMP_PASSWORD }),
    });
    const resetData = await resetRes.json();

    assert(resetRes.status === 200, `Reset password status is 200 (Got: ${resetRes.status})`);
    assert(resetData.success === true, 'Reset password returns success: true');
    console.log('🔒 Password reset to temporary password successfully.\n');

    // ----------------------------------------------------
    // TEST 5: Verify Old Password Fails & New Password Works
    // ----------------------------------------------------
    console.log('--- TEST 5: Verify New Password Login & Old Password Rejection ---');
    const oldLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    assert(oldLoginRes.status === 401, `Old password correctly rejected with 401 (Got: ${oldLoginRes.status})`);

    const newLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: TEMP_PASSWORD }),
    });
    const newLoginData = await newLoginRes.json();
    assert(newLoginRes.status === 200, `New password login succeeds with 200 (Got: ${newLoginRes.status})`);
    assert(newLoginData.user.role === 'ADMIN', 'Role remains ADMIN after password reset');
    console.log('🔐 New password validated and old password revoked.\n');

    // ----------------------------------------------------
    // TEST 6: Restore Original Admin Password (interns@LAINDAIN)
    // ----------------------------------------------------
    console.log('--- TEST 6: Restore Original Password & Final Verification ---');
    const restoreToken = jwt.sign(
      { id: loginData.user.id, email: ADMIN_EMAIL, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const restoreRes = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: restoreToken, newPassword: ADMIN_PASSWORD }),
    });
    const restoreData = await restoreRes.json();
    assert(restoreRes.status === 200, `Password restore status is 200 (Got: ${restoreRes.status})`);
    assert(restoreData.success === true, 'Password restored to interns@LAINDAIN');

    // Final Login Check
    const finalLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const finalLoginData = await finalLoginRes.json();
    assert(finalLoginRes.status === 200, 'Final login with interns@LAINDAIN successful (200)');
    assert(finalLoginData.user.role === 'ADMIN', 'Final user role verified as ADMIN');
    assert(typeof finalLoginData.token === 'string', 'Final JWT token generated');

    console.log('----------------------------------------------------');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('----------------------------------------------------');
    console.log('Admin Account Status:');
    console.log(`  - Email:    ${ADMIN_EMAIL}`);
    console.log(`  - Password: ${ADMIN_PASSWORD}`);
    console.log(`  - Role:     ${finalLoginData.user.role}`);
    console.log(`  - Verified: ${finalLoginData.user.is_email_verified}`);
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error(`❌ Test Suite Failed:`, error.message);
    process.exit(1);
  }
}

runTests();
