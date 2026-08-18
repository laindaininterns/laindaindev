const supabase = require('../src/config/supabase');
const NotificationService = require('../src/services/notificationService');

const API_BASE = 'http://localhost:5000/api';

async function runInputBindingsTest() {
  console.log('====================================================');
  console.log('🧪 CHECKOUT BINDINGS & NOTIFICATION SUMMARY TEST');
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
    // TEST 1: Notification Dev Summary & Suppression Handling
    // ----------------------------------------------------
    console.log('--- TEST 1: Order Notification Summary & Warning Handler ---');
    const mockOrder = {
      id: 'f1e2d3c4-b5a6-7890-1234-567890abcdef',
      customer_name: 'Muhammad Azhar',
      customer_email: 'test.suppressed@example.com',
      shipping_address: 'Plot #50, Sundar Industrial Estate',
      region: 'Lahore',
      total_amount: 15400,
      payment_method: 'Cash on Delivery (COD)',
      order_items: [
        {
          title: 'Wholesale Fabric Rolls',
          quantity: 10,
          unit_price: 1540,
          subtotal: 15400,
        },
      ],
    };

    const notifResult = await NotificationService.sendOrderConfirmationNotification(mockOrder);
    assert(Boolean(notifResult), 'NotificationService executed without unhandled throw');

    // ----------------------------------------------------
    // TEST 2: End-to-End Checkout with Clean Data
    // ----------------------------------------------------
    console.log('\n--- TEST 2: End-to-End Checkout Order Placement ---');
    const guestPhone = '03001234567';
    const checkoutRes = await fetch(`${API_BASE}/buyer/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-id': `gst_bind_${ts}`,
      },
      body: JSON.stringify({
        fullName: 'Clean Customer Name',
        region: 'Lahore',
        address: 'Model Town Commercial Block',
        phone: guestPhone,
        email: 'laindaininterns@gmail.com',
        payment_method: 'COD',
        items: [{ id: 1, quantity: 1, price: 850 }],
      }),
    });

    const checkoutData = await checkoutRes.json();
    assert(checkoutRes.status === 201, `Checkout created order (201) (Got: ${checkoutRes.status})`);
    assert(checkoutData.order.customer_phone === guestPhone, `Phone saved cleanly: ${checkoutData.order.customer_phone}`);
    assert(checkoutData.order.customer_name === 'Clean Customer Name', `Name saved cleanly: ${checkoutData.order.customer_name}`);
    createdOrderIds.push(checkoutData.order.order_id);

    // ----------------------------------------------------
    // CLEAN UP
    // ----------------------------------------------------
    console.log('\n--- CLEAN UP ---');
    if (createdOrderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', createdOrderIds);
      await supabase.from('orders').delete().in('id', createdOrderIds);
    }
    console.log('🗑️ Test orders cleaned up.');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED!`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (createdOrderIds.length > 0) {
      await supabase.from('order_items').delete().in('order_id', createdOrderIds);
      await supabase.from('orders').delete().in('id', createdOrderIds);
    }
    process.exit(1);
  }
}

runInputBindingsTest().then(() => process.exit(0));
