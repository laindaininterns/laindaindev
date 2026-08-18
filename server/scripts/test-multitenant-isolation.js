const supabase = require('../src/config/supabase');

const API_BASE = 'http://127.0.0.1:5000/api';

async function runMultiTenantTest() {
  console.log('====================================================');
  console.log('🧪 MULTI-TENANT SELLER DATA ISOLATION INTEGRATION TEST');
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

  const ts = Date.now();
  const sellerAEmail = `seller_alpha_${ts}@laindain.org`;
  const sellerAName = `Alpha Cotton Mills ${ts}`;
  const sellerAPass = `AlphaPass#${ts}!`;

  const sellerBEmail = `seller_beta_${ts}@laindain.org`;
  const sellerBName = `Beta Leather Craft ${ts}`;
  const sellerBPass = `BetaPass#${ts}!`;

  let userAId = null;
  let userBId = null;
  let sellerAProfileId = null;
  let sellerBProfileId = null;
  let tokenA = null;
  let tokenB = null;
  let productAId = null;

  try {
    // ----------------------------------------------------
    // STEP 1: Register Seller A and Seller B
    // ----------------------------------------------------
    console.log('--- STEP 1: Register Two Distinct Sellers ---');
    const resA = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sellerAEmail,
        password: sellerAPass,
        role: 'SELLER',
        profileData: { business_name: sellerAName, contact_number: '03001111111', tax_id: 'NTN-11111' },
      }),
    });
    const dataA = await resA.json();
    assert(resA.status === 201, 'Seller A registered (201)');
    userAId = dataA.user.id;

    const resB = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sellerBEmail,
        password: sellerBPass,
        role: 'SELLER',
        profileData: { business_name: sellerBName, contact_number: '03002222222', tax_id: 'NTN-22222' },
      }),
    });
    const dataB = await resB.json();
    assert(resB.status === 201, 'Seller B registered (201)');
    userBId = dataB.user.id;

    // Verify OTP for both
    const { data: dbA } = await supabase.from('users').select('email_verification_token').eq('id', userAId).single();
    await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sellerAEmail, code: dbA.email_verification_token }),
    });

    const { data: dbB } = await supabase.from('users').select('email_verification_token').eq('id', userBId).single();
    await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sellerBEmail, code: dbB.email_verification_token }),
    });

    // ----------------------------------------------------
    // STEP 2: Admin Approves Both Sellers
    // ----------------------------------------------------
    console.log('\n--- STEP 2: Admin Approves Both Sellers ---');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'laindaininterns@gmail.com', password: 'interns@LAINDAIN' }),
    });
    const adminData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Admin authenticated');

    await fetch(`${API_BASE}/admin/sellers/${userAId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminData.token}` },
      body: JSON.stringify({ status: 'APPROVED' }),
    });

    await fetch(`${API_BASE}/admin/sellers/${userBId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminData.token}` },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    console.log('👑 Admin approved Seller A & Seller B.');

    // ----------------------------------------------------
    // STEP 3: Authenticate Both Sellers & Verify Profiles
    // ----------------------------------------------------
    console.log('\n--- STEP 3: Authenticate Both Sellers & Verify Dynamic Profiles ---');
    const loginARes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sellerAEmail, password: sellerAPass }),
    });
    const loginAData = await loginARes.json();
    tokenA = loginAData.token;
    sellerAProfileId = loginAData.profile.id;
    assert(loginARes.status === 200, 'Seller A logged in successfully');
    assert(loginAData.profile.business_name === sellerAName, `Seller A business name matches: ${sellerAName}`);

    const loginBRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sellerBEmail, password: sellerBPass }),
    });
    const loginBData = await loginBRes.json();
    tokenB = loginBData.token;
    sellerBProfileId = loginBData.profile.id;
    assert(loginBRes.status === 200, 'Seller B logged in successfully');
    assert(loginBData.profile.business_name === sellerBName, `Seller B business name matches: ${sellerBName}`);
    assert(sellerAProfileId !== sellerBProfileId, 'Seller A and Seller B have distinct profile IDs');

    // ----------------------------------------------------
    // STEP 4: Verify Initial Empty States for Fresh Sellers
    // ----------------------------------------------------
    console.log('\n--- STEP 4: Verify Zero Products and Zero Orders for Fresh Sellers ---');
    const prodARes0 = await fetch(`${API_BASE}/seller/products`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const prodAData0 = await prodARes0.json();
    assert(prodARes0.status === 200, 'Seller A products fetch returns 200');
    assert(prodAData0.products.length === 0, `Seller A initial product count is 0 (Got: ${prodAData0.products.length})`);

    const prodBRes0 = await fetch(`${API_BASE}/seller/products`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const prodBData0 = await prodBRes0.json();
    assert(prodBRes0.status === 200, 'Seller B products fetch returns 200');
    assert(prodBData0.products.length === 0, `Seller B initial product count is 0 (Got: ${prodBData0.products.length})`);

    // ----------------------------------------------------
    // STEP 5: Seller A Adds a Wholesale Product
    // ----------------------------------------------------
    console.log('\n--- STEP 5: Seller A Adds Product ---');
    const createProdRes = await fetch(`${API_BASE}/seller/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        title: 'Alpha Pure Combed Cotton Yarn 40s',
        cat: 'Clothing & Apparel',
        price: 4500,
        moq: 50,
        stock_quantity: 500,
        description: 'Premium combed yarn manufactured by Alpha Cotton Mills.',
      }),
    });
    const createProdData = await createProdRes.json();
    assert(createProdRes.status === 201, 'Product created by Seller A (201)');
    productAId = createProdData.product.id;
    assert(createProdData.product.seller_id === sellerAProfileId, 'Product seller_id strictly matches Seller A profile ID');

    // ----------------------------------------------------
    // STEP 6: Multi-Tenant Query Scoping Verification
    // ----------------------------------------------------
    console.log('\n--- STEP 6: Multi-Tenant Query Scoping ---');
    const prodARes1 = await fetch(`${API_BASE}/seller/products`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const prodAData1 = await prodARes1.json();
    assert(prodAData1.products.length === 1, `Seller A sees exactly 1 product (Got: ${prodAData1.products.length})`);
    assert(prodAData1.products[0].id === productAId, 'Seller A sees own product');

    const prodBRes1 = await fetch(`${API_BASE}/seller/products`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const prodBData1 = await prodBRes1.json();
    assert(prodBData1.products.length === 0, `Seller B still sees 0 products in isolated dashboard (Got: ${prodBData1.products.length})`);
    console.log('🛡️ Multi-tenant read scoping verified.');

    // ----------------------------------------------------
    // STEP 7: Mutation Ownership Guard Verification
    // ----------------------------------------------------
    console.log('\n--- STEP 7: Mutation Ownership Guards (Cross-Tenant Modification Protection) ---');
    // Seller B attempts to update Seller A's product stock
    const crossUpdateRes = await fetch(`${API_BASE}/seller/products/${productAId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ stock: 9999 }),
    });
    assert(crossUpdateRes.status === 404 || crossUpdateRes.status === 403, `Seller B cannot update Seller A stock (Got: ${crossUpdateRes.status})`);

    // Seller B attempts to delete Seller A's product
    const crossDeleteRes = await fetch(`${API_BASE}/seller/products/${productAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossDeleteRes.status === 404 || crossDeleteRes.status === 403, `Seller B cannot delete Seller A product (Got: ${crossDeleteRes.status})`);

    // Seller A updates own product stock
    const ownUpdateRes = await fetch(`${API_BASE}/seller/products/${productAId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ stock: 650 }),
    });
    assert(ownUpdateRes.status === 200, 'Seller A successfully updates own stock (200)');
    console.log('🛡️ Multi-tenant mutation guards verified.');

    // ----------------------------------------------------
    // STEP 8: Clean Up All Test Entities from Database
    // ----------------------------------------------------
    console.log('\n--- STEP 8: Clean Up All Test Entities from Database ---');
    await supabase.from('products').delete().eq('id', productAId);
    await supabase.from('seller_profiles').delete().in('user_id', [userAId, userBId]);
    await supabase.from('users').delete().in('id', [userAId, userBId]);
    console.log('🗑️ Test sellers & products cleaned up completely from database.');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} MULTI-TENANT ISOLATION TESTS PASSED!`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Multi-tenant test error:', error.message);
    if (productAId) await supabase.from('products').delete().eq('id', productAId);
    if (userAId) {
      await supabase.from('seller_profiles').delete().eq('user_id', userAId);
      await supabase.from('users').delete().eq('id', userAId);
    }
    if (userBId) {
      await supabase.from('seller_profiles').delete().eq('user_id', userBId);
      await supabase.from('users').delete().eq('id', userBId);
    }
    process.exit(1);
  }
}

runMultiTenantTest().then(() => process.exit(0));
