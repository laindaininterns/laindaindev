const supabase = require('../src/config/supabase');

const API_BASE = 'http://localhost:5000/api';

async function runSearchVerification() {
  console.log('====================================================');
  console.log('🧪 LIVE DATABASE PRODUCT SEARCH VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Exact search for "keyboard"
    // ----------------------------------------------------
    console.log('--- TEST 1: Search Query "keyboard" ---');
    const res1 = await fetch(`${API_BASE}/products?search=keyboard`);
    const data1 = await res1.json();
    assert(res1.status === 200, `API returned status 200 (Got: ${res1.status})`);
    assert(data1.success === true, 'Response contains success: true');
    assert(Array.isArray(data1.products) && data1.products.length >= 1, `Found ${data1.products?.length} products matching "keyboard"`);
    
    const kbProduct = data1.products.find(p => p.title.toLowerCase().includes('keyboard'));
    assert(Boolean(kbProduct), `Found keyboard product with title: "${kbProduct?.title}"`);
    assert(kbProduct.price === 300, `Accurate price: Rs. ${kbProduct.price}`);
    assert(kbProduct.moq === 20, `Accurate MOQ: ${kbProduct.moq}`);
    assert(kbProduct.stock_quantity >= 1, `In stock quantity: ${kbProduct.stock_quantity}`);

    // ----------------------------------------------------
    // TEST 2: Case-Insensitive Search "KEYBOARD"
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Case-Insensitive Query "KEYBOARD" ---');
    const res2 = await fetch(`${API_BASE}/products?search=KEYBOARD`);
    const data2 = await res2.json();
    assert(data2.products.some(p => p.title.toLowerCase().includes('keyboard')), 'Case-insensitive matching returned keyboard product');

    // ----------------------------------------------------
    // TEST 3: Partial substring query "keyb"
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Substring Query "keyb" ---');
    const res3 = await fetch(`${API_BASE}/products?search=keyb`);
    const data3 = await res3.json();
    assert(data3.products.some(p => p.title.toLowerCase().includes('keyboard')), 'Prefix substring "keyb" returned keyboard product');

    // ----------------------------------------------------
    // TEST 4: Category Search (e.g. "textiles" / "machinery")
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Search for "cotton" & "machinery" ---');
    const res4 = await fetch(`${API_BASE}/products?search=cotton`);
    const data4 = await res4.json();
    assert(data4.products.length >= 1, `Found ${data4.products.length} products matching "cotton"`);

    // ----------------------------------------------------
    // TEST 5: Full catalog limit=100
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Full Marketplace Catalog Feed ---');
    const res5 = await fetch(`${API_BASE}/products?limit=100`);
    const data5 = await res5.json();
    assert(data5.products.length >= 13, `Catalog contains all active database products (Count: ${data5.products.length})`);
    assert(data5.products.some(p => p.id === kbProduct.id), 'Keyboard product is present in public marketplace feed');

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passed}/${total} SEARCH TESTS PASSED!`);
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Search test error:', error.message);
    process.exit(1);
  }
}

runSearchVerification().then(() => process.exit(0));
