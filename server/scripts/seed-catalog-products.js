const supabase = require('../src/config/supabase');

const PRODUCTS_SEED = [
  {
    id: '6723b5f6-1d67-4e05-af17-d1681e53f75f',
    numeric_id: 1,
    title: 'Faisalabad Textiles Co. - 100% Combed Cotton Rolls',
    category_name: 'Clothing & Apparel',
    description: 'Premium grade 100% combed cotton fabric rolls, wholesale weave bundles for garments manufacture.',
    price: 850,
    moq: 50,
    stock_quantity: 500,
    sku: 'TX-1001',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000002',
    numeric_id: 2,
    title: 'Lahore Ceramics Hub - Porcelain Floor Tiles',
    category_name: 'Tiles & Construction',
    description: 'Glazed porcelain floor tiles, non-slip 60x60cm high durability commercial grade.',
    price: 1200,
    moq: 100,
    stock_quantity: 500,
    sku: 'TC-2002',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000003',
    numeric_id: 3,
    title: 'Karachi Steel Traders - Stainless Kitchen Machinery',
    category_name: 'Home Appliances & Electronics',
    description: 'Commercial stainless steel heavy-duty kitchen appliances & food prep machinery.',
    price: 3400,
    moq: 25,
    stock_quantity: 500,
    sku: 'HA-3003',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000004',
    numeric_id: 4,
    title: 'Gujranwala Leather Works - Formal Oxford Shoes',
    category_name: 'Footwear',
    description: 'Genuine full-grain leather formal oxford & derby shoes, bulk retail assortment.',
    price: 1650,
    moq: 200,
    stock_quantity: 500,
    sku: 'FW-4004',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000005',
    numeric_id: 5,
    title: 'Sialkot Bags & Co. - Waterproof Duffel Bags',
    category_name: 'Bags & Luggage',
    description: 'Heavy-duty waterproof canvas duffel bags, tactical backpacks & sports gear bags.',
    price: 980,
    moq: 50,
    stock_quantity: 500,
    sku: 'BG-5005',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000006',
    numeric_id: 6,
    title: 'Punjab AgroChem - NPK Agricultural Fertilizer',
    category_name: 'Agriculture & Fertilizers',
    description: 'High-grade NPK nitrogen-rich agricultural fertilizer sacks (50kg bulk packs).',
    price: 2200,
    moq: 100,
    stock_quantity: 500,
    sku: 'AG-6006',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000007',
    numeric_id: 7,
    title: 'Multan Paints Ltd. - Exterior Emulsion Coating',
    category_name: 'Paints & Chemicals',
    description: 'All-weather UV resistant exterior emulsion paints & industrial protective coatings.',
    price: 1450,
    moq: 25,
    stock_quantity: 500,
    sku: 'PC-7007',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000008',
    numeric_id: 8,
    title: 'Hyderabad Home Textiles - 300TC Cotton Bedsheets',
    category_name: 'Bedding & Home Textiles',
    description: 'Export quality 300-thread count cotton bedsheet sets, king size bulk packages.',
    price: 1100,
    moq: 200,
    stock_quantity: 500,
    sku: 'HT-8008',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000009',
    numeric_id: 9,
    title: 'Islamabad Beauty Supplies - Organic Skincare Range',
    category_name: 'Cosmetics & Personal Care',
    description: 'Dermatologist-tested organic skincare range, retail-ready branded display boxes.',
    price: 760,
    moq: 50,
    stock_quantity: 500,
    sku: 'CP-9009',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000010',
    numeric_id: 10,
    title: 'Rawalpindi Sanitary Co. - Chrome Water Taps & Mixers',
    category_name: 'Sanitary & Bathroom Fittings',
    description: 'Solid brass chrome-plated bathroom water taps, mixers & concealed shower valves.',
    price: 1900,
    moq: 100,
    stock_quantity: 500,
    sku: 'SF-1010',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000011',
    numeric_id: 11,
    title: 'Karachi Cotton Mills - Printed Lawn 3-Piece Suits',
    category_name: 'Clothing & Apparel',
    description: 'Unstitched 3-piece printed lawn fabric suits, latest summer seasonal catalog.',
    price: 640,
    moq: 25,
    stock_quantity: 500,
    sku: 'TX-1111',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000012',
    numeric_id: 12,
    title: 'Lahore Footwear Traders - Casual Rubber Sole Sandals',
    category_name: 'Footwear',
    description: 'Ergonomic rubber sole casual sandals & chappals, assorted wholesale size boxes.',
    price: 520,
    moq: 200,
    stock_quantity: 500,
    sku: 'FW-1212',
  },
];

async function seedCatalog() {
  console.log('Seeding 12 wholesale products in Supabase...');

  // Get active seller
  const { data: seller } = await supabase
    .from('seller_profiles')
    .select('id')
    .eq('current_status', 'APPROVED')
    .limit(1)
    .single();

  const sellerId = seller ? seller.id : '18c3ab26-a682-4388-b7a6-1b715dfcda16';

  // Get categories map
  const { data: categories } = await supabase.from('categories').select('id, name');
  const catMap = {};
  if (categories) {
    categories.forEach((c) => {
      catMap[c.name] = c.id;
    });
  }

  for (const item of PRODUCTS_SEED) {
    const categoryId = catMap[item.category_name] || null;

    const { data: existing } = await supabase.from('products').select('id').eq('id', item.id).maybeSingle();

    if (existing) {
      await supabase
        .from('products')
        .update({
          title: item.title,
          category_id: categoryId,
          price: item.price,
          moq: item.moq,
          stock_quantity: item.stock_quantity,
          description: item.description,
          sku: item.sku,
          seller_id: sellerId,
          status: 'APPROVED',
          is_out_of_stock: false,
        })
        .eq('id', item.id);
      console.log(`Updated product: ${item.title}`);
    } else {
      await supabase.from('products').insert([
        {
          id: item.id,
          seller_id: sellerId,
          category_id: categoryId,
          title: item.title,
          price: item.price,
          moq: item.moq,
          stock_quantity: item.stock_quantity,
          description: item.description,
          sku: item.sku,
          status: 'APPROVED',
          is_out_of_stock: false,
        },
      ]);
      console.log(`Inserted product: ${item.title}`);
    }
  }

  console.log('Catalog seeding complete!');
}

seedCatalog().then(() => process.exit(0)).catch(console.error);
