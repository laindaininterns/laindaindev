const supabase = require('../src/config/supabase');

const API_BASE = 'http://127.0.0.1:5000/api';

async function runCheckoutFlowsTest() {
  console.log('====================================================');
  console.log('🧪 END-TO-END CHECKOUT FLOWS INTEGRATION TEST');
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
  const buyerEmail = `buyer_chk_flow_${ts}@laindain.org`;
  const buyerPass = `BuyerFlow#${ts}!`;
  let buyerUserId = null;
  let buyerToken = null;
  let buyerProfileId = null;

  // Test entities created
  const createdOrderIds = [];
  let testProductId = null;
  let originalStock = 0;

  try {
    // ----------------------------------------------------
    // PREPARATION: Fetch an active product for testing
    // ----------------------------------------------------
    console.log('--- PREPARATION: Selecting Catalog Product for Stock Testing ---');
    const { data: testProduct, error: pErr } = await supabase
      .from('products')
      .select('id, title, price, seller_id, stock_quantity')
      .gt('stock_quantity', 10)
      .limit(1)
      .single();

    assert(Boolean(testProduct && testProduct.id), `Found test product: "${testProduct?.title}" (ID: ${testProduct?.id})`);
    testProductId = testProduct.id;
    originalStock = testProduct.stock_quantity;
    console.log(`Initial Product Stock: ${originalStock}, Price: Rs. ${testProduct.price}`);

    // ----------------------------------------------------
    // FLOW A: SIGNED-IN BUYER CHECKOUT
    // ----------------------------------------------------
    console.log('\n--- FLOW A: Signed-In Buyer Checkout ---');

    // 1. Register & Verify Buyer
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: buyerEmail,
        password: buyerPass,
        role: 'BUYER',
        profileData: { full_name: 'Muhammad Azhar', contact_number: '03001234567' },
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Buyer registered (201)');
    buyerUserId = regData.user.id;

    const { data: dbUser } = await supabase.from('users').select('email_verification_token').eq('id', buyerUserId).single();
    if (dbUser?.email_verification_token) {
      await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: buyerEmail, code: dbUser.email_verification_token }),
      });
    }

    // 2. Buyer Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: buyerEmail, password: buyerPass }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Buyer logged in successfully (200)');
    buyerToken = loginData.token;
    buyerProfileId = loginData.profile?.id;

    // 3. Place Signed-In Order (2 units)
    const orderQtyA = 2;
    const checkoutARes = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        fullName: 'Muhammad Azhar',
        region: 'Lahore',
        address: 'Shop #14, Main Industrial Market, Gulberg',
        phone: '03001234567',
        payment_method: 'COD',
        items: [
          { product_id: testProductId, quantity: orderQtyA, price: testProduct.price },
        ],
      }),
    });
    const checkoutAData = await checkoutARes.json();
    assert(checkoutARes.status === 201, `Signed-in checkout succeeded (201) (Got: ${checkoutARes.status})`);
    assert(checkoutAData.success === true, 'Response contains success: true');
    assert(Boolean(checkoutAData.order?.order_id), `Order ID created: ${checkoutAData.order?.order_id}`);
    createdOrderIds.push(checkoutAData.order.order_id);

    // 4. Verify Database Records for Signed-In Order
    const { data: dbOrderA } = await supabase
      .from('orders')
      .select('*')
      .eq('id', checkoutAData.order.order_id)
      .single();

    assert(Boolean(dbOrderA), 'Order record found in database');
    assert(dbOrderA.buyer_profile_id !== null, 'orders.buyer_profile_id is linked to signed-in buyer');
    assert(dbOrderA.customer_name === 'Muhammad Azhar', `Customer name matches: ${dbOrderA.customer_name}`);
    assert(dbOrderA.customer_email === buyerEmail, `Auto-populated email matches user account: ${dbOrderA.customer_email}`);
    assert(dbOrderA.customer_phone === '03001234567', `Customer phone matches: ${dbOrderA.customer_phone}`);
    assert(dbOrderA.region === 'Lahore', `Region matches: ${dbOrderA.region}`);
    assert(dbOrderA.payment_method === 'COD', `Payment method is COD: ${dbOrderA.payment_method}`);
    assert(dbOrderA.status === 'PENDING', `Status is PENDING: ${dbOrderA.status}`);

    const { data: dbItemsA } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', dbOrderA.id);

    assert(dbItemsA.length === 1, `order_items row created (Count: ${dbItemsA.length})`);
    assert(dbItemsA[0].product_id === testProductId, 'order_items.product_id matches');
    assert(dbItemsA[0].seller_id === testProduct.seller_id, 'order_items.seller_id matches vendor');
    assert(dbItemsA[0].quantity === orderQtyA, `order_items.quantity matches: ${orderQtyA}`);
    assert(parseFloat(dbItemsA[0].unit_price) === parseFloat(testProduct.price), 'order_items.unit_price matches');

    // 5. Verify Stock Decrement
    const { data: prodAfterA } = await supabase.from('products').select('stock_quantity').eq('id', testProductId).single();
    assert(prodAfterA.stock_quantity === originalStock - orderQtyA, `Stock decremented accurately from ${originalStock} to ${prodAfterA.stock_quantity}`);

    // ----------------------------------------------------
    // FLOW B: GUEST CHECKOUT
    // ----------------------------------------------------
    console.log('\n--- FLOW B: Guest Checkout ---');

    const guestSessionId = `gst_test_flow_${ts}`;
    const orderQtyB = 3;

    // Case 1: Valid Guest Order (with optional email)
    const guestCheckoutRes1 = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestSessionId,
      },
      body: JSON.stringify({
        fullName: 'Tariq Wholesale Trading',
        region: 'Karachi',
        address: 'Boulton Market, M.A. Jinnah Road',
        phone: '03219876543',
        email: 'tariq.guest@example.com',
        payment_method: 'COD',
        items: [
          { product_id: testProductId, quantity: orderQtyB, price: testProduct.price },
        ],
      }),
    });
    const guestData1 = await guestCheckoutRes1.json();
    assert(guestCheckoutRes1.status === 201, `Guest checkout with email succeeded (201) (Got: ${guestCheckoutRes1.status})`);
    createdOrderIds.push(guestData1.order.order_id);

    const { data: dbOrderGuest1 } = await supabase
      .from('orders')
      .select('*')
      .eq('id', guestData1.order.order_id)
      .single();

    assert(dbOrderGuest1.buyer_profile_id === null, 'Guest order has buyer_profile_id = null');
    assert(dbOrderGuest1.guest_id === guestSessionId, `Guest order tracks guest_id: ${dbOrderGuest1.guest_id}`);
    assert(dbOrderGuest1.customer_name === 'Tariq Wholesale Trading', 'Customer name is saved');
    assert(dbOrderGuest1.customer_phone === '03219876543', 'Customer phone is saved');
    assert(dbOrderGuest1.customer_email === 'tariq.guest@example.com', 'Optional email is stored');
    assert(dbOrderGuest1.payment_method === 'COD', 'Payment method is COD');

    // Case 2: Valid Guest Order (without optional email)
    const guestCheckoutRes2 = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestSessionId,
      },
      body: JSON.stringify({
        fullName: 'Imran Textiles',
        region: 'Faisalabad',
        address: 'Clock Tower Cloth Market',
        phone: '03015555555',
        email: '',
        payment_method: 'COD',
        items: [
          { product_id: testProductId, quantity: 1, price: testProduct.price },
        ],
      }),
    });
    const guestData2 = await guestCheckoutRes2.json();
    assert(guestCheckoutRes2.status === 201, `Guest checkout without email succeeded (201) (Got: ${guestCheckoutRes2.status})`);
    createdOrderIds.push(guestData2.order.order_id);

    const { data: dbOrderGuest2 } = await supabase
      .from('orders')
      .select('*')
      .eq('id', guestData2.order.order_id)
      .single();

    assert(dbOrderGuest2.customer_email === null, 'Omitted email is stored as NULL');
    assert(dbOrderGuest2.customer_phone === '03015555555', 'Compulsory phone is present');

    // Case 3: Invalid Phone Validation Rejection (e.g. 5 digits)
    console.log('\n--- Validation Guards: Invalid Phone & Stock Bounds ---');
    const invalidPhoneRes = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestSessionId,
      },
      body: JSON.stringify({
        fullName: 'Invalid Customer',
        region: 'Lahore',
        address: 'Test Address',
        phone: '03001', // Too short
        payment_method: 'COD',
        items: [{ product_id: testProductId, quantity: 1, price: testProduct.price }],
      }),
    });
    assert(invalidPhoneRes.status === 400, `Short phone rejected with 400 (Got: ${invalidPhoneRes.status})`);

    // Case 4: Insufficient Stock Rejection (Quantity exceeds availability)
    const excessStockRes = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': guestSessionId,
      },
      body: JSON.stringify({
        fullName: 'Excess Customer',
        region: 'Lahore',
        address: 'Test Address',
        phone: '03001234567',
        payment_method: 'COD',
        items: [{ product_id: testProductId, quantity: 999999, price: testProduct.price }],
      }),
    });
    const excessData = await excessStockRes.json();
    assert(excessStockRes.status === 400, `Excess quantity rejected with 400 (Got: ${excessStockRes.status})`);
    assert(excessData.message.includes('Insufficient stock'), `Error message mentions insufficient stock (Got: ${excessData.message})`);

    // ----------------------------------------------------
    // CLEAN UP & RESTORATION
    // ----------------------------------------------------
    console.log('\n--- CLEAN UP: Restoring Inventory & Removing Test Orders ---');
    // Restore product stock
    await supabase.from('products').update({ stock_quantity: originalStock }).eq('id', testProductId);

    // Delete created order items and orders
    if (createdOrderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', createdOrderIds);
      await supabase.from('orders').delete().in('id', createdOrderIds);
    }

    // Delete buyer user
    if (buyerUserId) {
      await supabase.from('buyer_profiles').delete().eq('user_id', buyerUserId);
      await supabase.from('users').delete().eq('id', buyerUserId);
    }

    console.log('🗑️ Database records cleaned up and inventory restored.');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} CHECKOUT INTEGRATION TESTS PASSED!`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Checkout test failed:', error.message);
    if (testProductId) {
      await supabase.from('products').update({ stock_quantity: originalStock }).eq('id', testProductId);
    }
    if (createdOrderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', createdOrderIds);
      await supabase.from('orders').delete().in('id', createdOrderIds);
    }
    if (buyerUserId) {
      await supabase.from('buyer_profiles').delete().eq('user_id', buyerUserId);
      await supabase.from('users').delete().eq('id', buyerUserId);
    }
    process.exit(1);
  }
}

runCheckoutFlowsTest().then(() => process.exit(0));
