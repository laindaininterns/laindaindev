const supabase = require('../config/supabase');

/**
 * Static knowledge definitions for LainDain B2B Platform
 */
const PLATFORM_INFO = {
  name: 'LainDain (Land10)',
  tagline: 'Pakistan\'s Premier B2B Wholesale Marketplace',
  description: 'LainDain connects verified Pakistani manufacturers, wholesale suppliers, and distributors directly with retail buyers and businesses.',
  moqExplanation: 'MOQ stands for Minimum Order Quantity. Verified suppliers on LainDain set minimum units per order to ensure true wholesale bulk pricing.',
  sellerVerification: 'Sellers undergo AI-assisted business verification, NTN/tax ID checks, and physical business address confirmation before being listed as Verified Suppliers.',
  buyerRegistration: 'Buyers can register for free with their email and business contact details to browse wholesale prices, place bulk orders, and request custom RFQs.',
  supportEmail: 'support@laindain.pk',
  categories: [
    'Clothing & Apparel',
    'Bags & Luggage',
    'Footwear',
    'Agriculture & Fertilizers',
    'Paints & Chemicals',
    'Home Appliances & Electronics',
    'Bedding & Home Textiles',
    'Cosmetics & Personal Care',
    'Tiles & Construction',
    'Sanitary & Bathroom Fittings',
  ],
  faqs: [
    {
      q_en: 'How do I place a bulk wholesale order?',
      a_en: 'Select your desired product, choose order quantity meeting or exceeding the supplier\'s Minimum Order Quantity (MOQ), select color/size variants, and click Add to Bulk Cart or Request Custom Quotation.',
      q_ur: 'ہول سیل بلک آرڈر کیسے پلیس کریں؟',
      a_ur: 'اپنی مطلوبہ پراڈکٹ منتخب کریں، سپلائر کی کم از کم آرڈر مقدار (MOQ) کے مطابق کوانٹٹی چنیں اور ایڈ ٹو بلک کارٹ پر کلک کریں۔',
    },
    {
      q_en: 'Are prices negotiable on LainDain?',
      a_en: 'Yes! For large volume orders above standard MOQ, buyers can request custom quotes directly from verified sellers.',
      q_ur: 'کیا LainDain پر قیمتوں میں بات چیت ہو سکتی ہے؟',
      a_ur: 'جی ہاں! بڑی مقدار کے آرڈرز کے لیے خریدار تصدیق شدہ سپلائرز سے کسٹم کوٹیشن کی درخواست کر سکتے ہیں۔',
    },
    {
      q_en: 'How does seller verification work?',
      a_en: 'LainDain verifies business tax registration (NTN), business address, and manufacturing capabilities before granting the Verified Supplier badge.',
      q_ur: 'سپلائر کی تصدیق کیسے ہوتی ہے؟',
      a_ur: 'LainDain سپلائر کے بزنس رجسٹریشن (NTN)، پتہ اور تیار کرنے کی صلاحیت کی تصدیق کے بعد بیج جاری کرتا ہے۔',
    },
  ],
};

/**
 * Fallback product catalog for when database is unreachable
 */
const FALLBACK_PRODUCTS = [
  { id: 1, title: 'Export Quality Cotton T-Shirts Pack', category: 'Clothing & Apparel', price: 'Rs. 450/pc', moq: '50 pcs' },
  { id: 2, title: 'Genuine Leather Executive Briefcase', category: 'Bags & Luggage', price: 'Rs. 2,800/pc', moq: '10 pcs' },
  { id: 3, title: 'Industrial Safety Boots (Steel Toe)', category: 'Footwear', price: 'Rs. 1,950/pair', moq: '20 pairs' },
  { id: 4, title: 'Organic NPK Fertilizer 50kg Bags', category: 'Agriculture & Fertilizers', price: 'Rs. 3,200/bag', moq: '10 bags' },
  { id: 5, title: 'Weatherproof Emulsion Exterior Paint 16L', category: 'Paints & Chemicals', price: 'Rs. 4,500/can', moq: '5 cans' },
  { id: 6, title: 'Commercial Inverter Split AC 1.5 Ton', category: 'Home Appliances & Electronics', price: 'Rs. 115,000/unit', moq: '2 units' },
];

/**
 * Compact catalog fetching helper (BE-20 compliant - explicit field selection)
 */
async function getCatalogSummary() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, category, price, moq')
      .limit(30);

    if (error || !products || products.length === 0) {
      return FALLBACK_PRODUCTS;
    }

    return products.map((p) => ({
      id: p.id,
      title: p.title || 'Wholesale Product',
      category: p.category || 'General',
      price: typeof p.price === 'number' ? `Rs. ${p.price}` : p.price || 'Market Rate',
      moq: p.moq ? `${p.moq}` : 'Standard MOQ',
    }));
  } catch (err) {
    console.warn('Unable to query Supabase catalog summary for chatbot, using fallback:', err.message);
    return FALLBACK_PRODUCTS;
  }
}

module.exports = {
  PLATFORM_INFO,
  getCatalogSummary,
};
