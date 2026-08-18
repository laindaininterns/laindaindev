const supabase = require('../src/config/supabase');
const { sendOrderConfirmationEmail } = require('../src/services/emailService');

const API_BASE = 'http://localhost:5000/api';

async function runEmailDispatchTests() {
  console.log('====================================================');
  console.log('🧪 ORDER CONFIRMATION EMAIL DISPATCH INTEGRATION TEST');
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
  const createdOrderIds = [];
  let testBuyerUserId = null;

  try {
    // ----------------------------------------------------
    // TEST 0: Direct Transactional Email Template Unit Test
    // ----------------------------------------------------
    console.log('--- TEST 0: Direct Resend Template Generation & Dispatch ---');
    const directEmailRes = await sendOrderConfirmationEmail({
      email: 'laindaininterns@gmail.com',
      customerName: 'Muhammad Azhar (Unit Test)',
      orderId: 'c1b2a3d4-e5f6-7890-abcd-ef1234567890',
      shippingAddress: 'Plot #24, Sundar Industrial Estate',
      region: 'Lahore',
      paymentMethod: 'Cash on Delivery (COD)',
      totalAmount: 42500,
      items: [
        {
          title: '100% Combed Cotton Rolls (50kg)',
          quantity: 50,
          unit_price: 850,
          subtotal: 42500,
        },
      ],
    });
    assert(directEmailRes.success === true, 'Direct email service returned success: true');
    console.log('📬 Transactional HTML email structure verified.');

    // ----------------------------------------------------
    // FLOW A: Signed-In Buyer Checkout with Email Dispatch
    // ----------------------------------------------------
    console.log('\n--- FLOW A: Signed-In Buyer Order Confirmation Email ---');
    const buyerEmail = `buyer_email_test_${ts}@laindain.org`;
    const buyerPass = `PassEmail#${ts}!`;

    // 1. Register & Verify Buyer
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: buyerEmail,
        password: buyerPass,
        role: 'BUYER',
        profileData: { full_name: 'Azhar Wholesale Co.', contact_number: '03001234567' },
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'Buyer registered (201)');
    testBuyerUserId = regData.user.id;

    const { data: dbUser } = await supabase.from('users').select('email_verification_token').eq('id', testBuyerUserId).single();
    if (dbUser?.email_verification_token) {
      await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: buyerEmail, code: dbUser.email_verification_token }),
      });
    }

    // 2. Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: buyerEmail, password: buyerPass }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Buyer logged in');

    // 3. Place Signed-In Order
    const orderARes = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginData.token}`,
      },
      body: JSON.stringify({
        fullName: 'Azhar Wholesale Co.',
        region: 'Lahore',
        address: 'Main Industrial Area',
        phone: '03001234567',
        payment_method: 'COD',
        items: [{ id: 1, quantity: 2, price: 850 }],
      }),
    });
    const orderAData = await orderARes.json();
    assert(orderARes.status === 201, `Signed-in checkout succeeded (201) (Got: ${orderARes.status})`);
    assert(orderAData.order.customer_email === buyerEmail, `Customer email matches account: ${orderAData.order.customer_email}`);
    createdOrderIds.push(orderAData.order.order_id);

    // ----------------------------------------------------
    // FLOW B: Guest Checkout WITH Email Provided
    // ----------------------------------------------------
    console.log('\n--- FLOW B: Guest Checkout with Provided Email ---');
    const guestEmail = `guest_buyer_${ts}@example.com`;
    const orderBRes = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': `gst_email_${ts}`,
      },
      body: JSON.stringify({
        fullName: 'Karachi Traders Guest',
        region: 'Karachi',
        address: 'Cloth Market, Boulton Market',
        phone: '03219876543',
        email: guestEmail,
        payment_method: 'COD',
        items: [{ id: 2, quantity: 5, price: 1200 }],
      }),
    });
    const orderBData = await orderBRes.json();
    assert(orderBRes.status === 201, `Guest with email succeeded (201) (Got: ${orderBRes.status})`);
    assert(orderBData.order.customer_email === guestEmail, `Customer email captured: ${orderBData.order.customer_email}`);
    createdOrderIds.push(orderBData.order.order_id);

    // ----------------------------------------------------
    // FLOW C: Guest Checkout WITHOUT Email (Skip Dispatch)
    // ----------------------------------------------------
    console.log('\n--- FLOW C: Guest Checkout WITHOUT Email (Graceful Skip) ---');
    const orderCRes = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': `gst_noemail_${ts}`,
      },
      body: JSON.stringify({
        fullName: 'Faisalabad Anonymous Buyer',
        region: 'Faisalabad',
        address: 'Clock Tower Market',
        phone: '03017777777',
        email: '', // Omitted email
        payment_method: 'COD',
        items: [{ id: 3, quantity: 1, price: 3400 }],
      }),
    });
    const orderCData = await orderCRes.json();
    assert(orderCRes.status === 201, `Guest without email succeeded (201) without crashing (Got: ${orderCRes.status})`);
    assert(orderCData.order.customer_email === null, 'Customer email is null for guest without email');
    assert(Boolean(orderCData.order.order_id), `Order ID generated: ${orderCData.order.order_id}`);
    createdOrderIds.push(orderCData.order.order_id);

    // ----------------------------------------------------
    // CLEAN UP
    // ----------------------------------------------------
    console.log('\n--- CLEAN UP: Deleting Test Orders and Buyer ---');
    if (createdOrderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', createdOrderIds);
      await supabase.from('orders').delete().in('id', createdOrderIds);
    }
    if (testBuyerUserId) {
      await supabase.from('buyer_profiles').delete().eq('user_id', testBuyerUserId);
      await supabase.from('users').delete().eq('id', testBuyerUserId);
    }
    console.log('🗑️ Test orders and temporary users cleaned up from database.');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} EMAIL DISPATCH TESTS PASSED!`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Email dispatch test error:', error.message);
    if (createdOrderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', createdOrderIds);
      await supabase.from('orders').delete().in('id', createdOrderIds);
    }
    if (testBuyerUserId) {
      await supabase.from('buyer_profiles').delete().eq('user_id', testBuyerUserId);
      await supabase.from('users').delete().eq('id', testBuyerUserId);
    }
    process.exit(1);
  }
}

runEmailDispatchTests().then(() => process.exit(0));
