const supabase = require('../src/config/supabase');

const API_BASE = 'http://localhost:5000/api';

async function runLookupResilienceTest() {
  console.log('====================================================');
  console.log('🧪 CHECKOUT PRODUCT RESOLUTION & LOOKUP RESILIENCE TEST');
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

  try {
    // ----------------------------------------------------
    // TEST 1: Cart item with legacy numeric ID (id: 1)
    // ----------------------------------------------------
    console.log('--- TEST 1: Legacy Numeric Product ID (id: 1) ---');
    const res1 = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': `gst_resil_${ts}_1`,
      },
      body: JSON.stringify({
        fullName: 'Test Buyer 1',
        region: 'Lahore',
        address: 'Main Market Gulberg',
        phone: '03001111111',
        payment_method: 'COD',
        items: [
          { id: 1, quantity: 2, price: 850 },
        ],
      }),
    });
    const data1 = await res1.json();
    assert(res1.status === 201, `Order created for numeric ID 1 with 201 (Got: ${res1.status})`);
    assert(Boolean(data1.order?.order_id), `Order ID returned: ${data1.order?.order_id}`);
    createdOrderIds.push(data1.order.order_id);

    const { data: dbItems1 } = await supabase.from('order_items').select('*').eq('order_id', data1.order.order_id);
    assert(dbItems1.length === 1, '1 order_item inserted');
    assert(dbItems1[0].product_id === '6723b5f6-1d67-4e05-af17-d1681e53f75f', 'Mapped numeric ID 1 to correct Supabase UUID');

    // ----------------------------------------------------
    // TEST 2: Cart item with string numeric ID ("2")
    // ----------------------------------------------------
    console.log('\n--- TEST 2: String Numeric Product ID ("2") ---');
    const res2 = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': `gst_resil_${ts}_2`,
      },
      body: JSON.stringify({
        fullName: 'Test Buyer 2',
        region: 'Faisalabad',
        address: 'Satyana Road',
        phone: '03002222222',
        payment_method: 'COD',
        items: [
          { product_id: '2', quantity: 5, price: 1200 },
        ],
      }),
    });
    const data2 = await res2.json();
    assert(res2.status === 201, `Order created for string numeric ID "2" with 201 (Got: ${res2.status})`);
    createdOrderIds.push(data2.order.order_id);

    const { data: dbItems2 } = await supabase.from('order_items').select('*').eq('order_id', data2.order.order_id);
    assert(dbItems2.length === 1, '1 order_item inserted');
    assert(dbItems2[0].product_id === 'd1000000-0000-0000-0000-000000000002', 'Mapped ID "2" to Lahore Ceramics Hub UUID');

    // ----------------------------------------------------
    // TEST 3: Cart item with direct Supabase UUID
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Direct Supabase UUID ---');
    const res3 = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': `gst_resil_${ts}_3`,
      },
      body: JSON.stringify({
        fullName: 'Test Buyer 3',
        region: 'Karachi',
        address: 'Tariq Road',
        phone: '03003333333',
        payment_method: 'COD',
        items: [
          { product_id: 'd1000000-0000-0000-0000-000000000003', quantity: 1, price: 3400 },
        ],
      }),
    });
    const data3 = await res3.json();
    assert(res3.status === 201, `Order created for direct UUID with 201 (Got: ${res3.status})`);
    createdOrderIds.push(data3.order.order_id);

    // ----------------------------------------------------
    // TEST 4: Multi-item cart mixing UUID, numeric ID, and product_id property
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Multi-Item Mixed Cart ---');
    const res4 = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': `gst_resil_${ts}_4`,
      },
      body: JSON.stringify({
        fullName: 'Test Buyer 4 (Mixed Cart)',
        region: 'Rawalpindi',
        address: 'Raja Bazaar Commercial Area',
        phone: '03004444444',
        payment_method: 'COD',
        items: [
          { id: 1, quantity: 2, price: 850 },
          { product_id: 'd1000000-0000-0000-0000-000000000004', quantity: 3, price: 1650 },
          { productId: 5, quantity: 1, price: 980 },
        ],
      }),
    });
    const data4 = await res4.json();
    assert(res4.status === 201, `Mixed cart order created with 201 (Got: ${res4.status})`);
    createdOrderIds.push(data4.order.order_id);

    const { data: dbItems4 } = await supabase.from('order_items').select('*').eq('order_id', data4.order.order_id);
    assert(dbItems4.length === 3, 'All 3 mixed items correctly resolved and inserted into order_items');

    // ----------------------------------------------------
    // CLEAN UP
    // ----------------------------------------------------
    console.log('\n--- CLEAN UP: Deleting Test Orders ---');
    if (createdOrderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', createdOrderIds);
      await supabase.from('orders').delete().in('id', createdOrderIds);
    }
    console.log('🗑️ Test orders successfully cleaned up.');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} PRODUCT RESOLUTION TESTS PASSED!`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Resilience test error:', error.message);
    if (createdOrderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', createdOrderIds);
      await supabase.from('orders').delete().in('id', createdOrderIds);
    }
    process.exit(1);
  }
}

runLookupResilienceTest().then(() => process.exit(0));
