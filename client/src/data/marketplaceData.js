import product01 from "../assets/products/product-01-faisalabad-textiles.jpg";
import product02 from "../assets/products/product-02-lahore-ceramics.jpg";
import product03 from "../assets/products/product-03-karachi-steel.jpg";
import product04 from "../assets/products/product-04-gujranwala-leather.jpg";
import product05 from "../assets/products/product-05-sialkot-bags.jpg";
import product06 from "../assets/products/product-06-punjab-agrochem.jpg";
import product07 from "../assets/products/product-07-multan-paints.jpg";
import product08 from "../assets/products/product-08-hyderabad-textiles.jpg";
import product09 from "../assets/products/product-09-islamabad-beauty.jpg";
import product10 from "../assets/products/product-10-rawalpindi-sanitary.jpg";
import product11 from "../assets/products/product-11-karachi-cotton.jpg";
import product12 from "../assets/products/product-12-lahore-footwear.jpg";

// Design System Tokens (as specified in design.md & laindainapproveddesign.html)
export const TOKENS = {
  sage: "#A3C1BF",
  sageDark: "#85A6A3",
  sageTint: "#EEF3F2",
  offWhite: "#F9F9F6",
  surface: "#FFFFFF",
  black: "#000000",
  textMuted: "#5B5B58",
  border: "#E9E8E2",
  error: "#C6564D",
};

// Categories List
export const CATEGORIES = [
  "All Suppliers",
  "Clothing & Apparel",
  "Bags & Luggage",
  "Footwear",
  "Agriculture & Fertilizers",
  "Paints & Chemicals",
  "Home Appliances & Electronics",
  "Bedding & Home Textiles",
  "Cosmetics & Personal Care",
  "Tiles & Construction",
  "Sanitary & Bathroom Fittings",
];

// Category Icons Mapping
export const CAT_ICONS = {
  "Clothing & Apparel": "👕",
  "Bags & Luggage": "👜",
  "Footwear": "👟",
  "Agriculture & Fertilizers": "🌾",
  "Paints & Chemicals": "🎨",
  "Home Appliances & Electronics": "🔌",
  "Electronics & Machinery": "⚡",
  "Industrial & Machinery": "⚙️",
  "Bedding & Home Textiles": "🛏️",
  "Cosmetics & Personal Care": "💄",
  "Tiles & Construction": "🧱",
  "Sanitary & Bathroom Fittings": "🚿",
  "General Wholesale": "📦",
};

// Category High-Res Fallback Images Mapping
export const CAT_IMAGES = {
  "Clothing & Apparel": product01,
  "Tiles & Construction": product02,
  "Home Appliances & Electronics": product03,
  "Electronics & Machinery": product03,
  "Industrial & Machinery": product03,
  "Footwear": product04,
  "Bags & Luggage": product05,
  "Agriculture & Fertilizers": product06,
  "Paints & Chemicals": product07,
  "Bedding & Home Textiles": product08,
  "Cosmetics & Personal Care": product09,
  "Sanitary & Bathroom Fittings": product10,
  "General Wholesale": product01,
};

// Available Color Options for Wholesale Product Selection
export const COLOR_OPTIONS = {
  "Clothing & Apparel": [
    { name: "Raw White", hex: "#F5F5F0" },
    { name: "Navy Blue", hex: "#1B2A4A" },
    { name: "Sage Green", hex: "#85A6A3" },
    { name: "Charcoal Black", hex: "#222222" },
  ],
  "Footwear": [
    { name: "Black Leather", hex: "#1C1C1C" },
    { name: "Tan Brown", hex: "#8B5A2B" },
    { name: "Oxblood Red", hex: "#4A0E17" },
  ],
  "Bags & Luggage": [
    { name: "Canvas Khaki", hex: "#C2B280" },
    { name: "Matte Black", hex: "#1A1A1A" },
    { name: "Olive Green", hex: "#556B2F" },
  ],
  "Paints & Chemicals": [
    { name: "Pure White", hex: "#FFFFFF" },
    { name: "Cream Sand", hex: "#FDF5E6" },
    { name: "Sky Blue", hex: "#87CEEB" },
  ],
  "Bedding & Home Textiles": [
    { name: "Pastel Sage", hex: "#A3C1BF" },
    { name: "Soft Ivory", hex: "#FFFFF0" },
    { name: "Dusty Rose", hex: "#DCAE96" },
  ],
};

// Initial Suppliers / Products Dataset
export const PRODUCTS = [
  {
    id: 1,
    product_id: "6723b5f6-1d67-4e05-af17-d1681e53f75f",
    name: "Faisalabad Textiles Co.",
    cat: "Clothing & Apparel",
    desc: "Premium grade 100% combed cotton fabric rolls, wholesale weave bundles for garments manufacture.",
    price: 850,
    moq: 50,
    verified: true,
    rating: "4.9 ⭐ (142 orders)",
    imageBg: "from-[#E6EFEF] to-[#CDE2E0]",
    hasColors: true,
    image: product01,
  },
  {
    id: 2,
    product_id: "d1000000-0000-0000-0000-000000000002",
    name: "Lahore Ceramics Hub",
    cat: "Tiles & Construction",
    desc: "Glazed porcelain floor tiles, non-slip 60x60cm high durability commercial grade.",
    price: 1200,
    moq: 100,
    verified: true,
    rating: "4.8 ⭐ (98 orders)",
    imageBg: "from-[#F0ECE1] to-[#D9D2C3]",
    hasColors: false,
    image: product02,
  },
  {
    id: 3,
    product_id: "d1000000-0000-0000-0000-000000000003",
    name: "Karachi Steel Traders",
    cat: "Home Appliances & Electronics",
    desc: "Commercial stainless steel heavy-duty kitchen appliances & food prep machinery.",
    price: 3400,
    moq: 25,
    verified: true,
    rating: "5.0 ⭐ (74 orders)",
    imageBg: "from-[#EAEAEA] to-[#CDCDCD]",
    hasColors: false,
    image: product03,
  },
  {
    id: 4,
    product_id: "d1000000-0000-0000-0000-000000000004",
    name: "Gujranwala Leather Works",
    cat: "Footwear",
    desc: "Genuine full-grain leather formal oxford & derby shoes, bulk retail assortment.",
    price: 1650,
    moq: 200,
    verified: true,
    rating: "4.7 ⭐ (215 orders)",
    imageBg: "from-[#F3E5D8] to-[#D5BAA2]",
    hasColors: true,
    image: product04,
  },
  {
    id: 5,
    product_id: "d1000000-0000-0000-0000-000000000005",
    name: "Sialkot Bags & Co.",
    cat: "Bags & Luggage",
    desc: "Heavy-duty waterproof canvas duffel bags, tactical backpacks & sports gear bags.",
    price: 980,
    moq: 50,
    verified: false,
    rating: "4.6 ⭐ (62 orders)",
    imageBg: "from-[#E5E9E0] to-[#C3CCA7]",
    hasColors: true,
    image: product05,
  },
  {
    id: 6,
    product_id: "d1000000-0000-0000-0000-000000000006",
    name: "Punjab AgroChem",
    cat: "Agriculture & Fertilizers",
    desc: "High-grade NPK nitrogen-rich agricultural fertilizer sacks (50kg bulk packs).",
    price: 2200,
    moq: 100,
    verified: true,
    rating: "4.9 ⭐ (310 orders)",
    imageBg: "from-[#E8F0E6] to-[#BED4B9]",
    hasColors: false,
    image: product06,
  },
  {
    id: 7,
    product_id: "d1000000-0000-0000-0000-000000000007",
    name: "Multan Paints Ltd.",
    cat: "Paints & Chemicals",
    desc: "All-weather UV resistant exterior emulsion paints & industrial protective coatings.",
    price: 1450,
    moq: 25,
    verified: true,
    rating: "4.8 ⭐ (112 orders)",
    imageBg: "from-[#EAF2F8] to-[#BDD5E7]",
    hasColors: true,
    image: product07,
  },
  {
    id: 8,
    product_id: "d1000000-0000-0000-0000-000000000008",
    name: "Hyderabad Home Textiles",
    cat: "Bedding & Home Textiles",
    desc: "Export quality 300-thread count cotton bedsheet sets, king size bulk packages.",
    price: 1100,
    moq: 200,
    verified: false,
    rating: "4.5 ⭐ (85 orders)",
    imageBg: "from-[#F9EFF3] to-[#E3C6D3]",
    hasColors: true,
    image: product08,
  },
  {
    id: 9,
    product_id: "d1000000-0000-0000-0000-000000000009",
    name: "Islamabad Beauty Supplies",
    cat: "Cosmetics & Personal Care",
    desc: "Dermatologist-tested organic skincare range, retail-ready branded display boxes.",
    price: 760,
    moq: 50,
    verified: true,
    rating: "4.9 ⭐ (180 orders)",
    imageBg: "from-[#FDF2F4] to-[#F1C2CB]",
    hasColors: false,
    image: product09,
  },
  {
    id: 10,
    product_id: "d1000000-0000-0000-0000-000000000010",
    name: "Rawalpindi Sanitary Co.",
    cat: "Sanitary & Bathroom Fittings",
    desc: "Solid brass chrome-plated bathroom water taps, mixers & concealed shower valves.",
    price: 1900,
    moq: 100,
    verified: true,
    rating: "4.8 ⭐ (94 orders)",
    imageBg: "from-[#ECEFF1] to-[#B0BEC5]",
    hasColors: false,
    image: product10,
  },
  {
    id: 11,
    product_id: "d1000000-0000-0000-0000-000000000011",
    name: "Karachi Cotton Mills",
    cat: "Clothing & Apparel",
    desc: "Unstitched 3-piece printed lawn fabric suits, latest summer seasonal catalog.",
    price: 640,
    moq: 25,
    verified: true,
    rating: "5.0 ⭐ (420 orders)",
    imageBg: "from-[#F3E9F8] to-[#D5BCED]",
    hasColors: true,
    image: product11,
  },
  {
    id: 12,
    product_id: "d1000000-0000-0000-0000-000000000012",
    name: "Lahore Footwear Traders",
    cat: "Footwear",
    desc: "Ergonomic rubber sole casual sandals & chappals, assorted wholesale size boxes.",
    price: 520,
    moq: 200,
    verified: false,
    rating: "4.4 ⭐ (53 orders)",
    imageBg: "from-[#FAF3E0] to-[#E6CD97]",
    hasColors: true,
    image: product12,
  },
];

// Validation Helper Functions
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(v) {
  if (!v.trim()) return "Enter your email address to continue.";
  if (!EMAIL_RE.test(v.trim())) return "Enter a valid email address, e.g. you@company.com.";
  return "";
}

export function validatePassword(v) {
  if (!v) return "Enter your password to continue.";
  if (v.length < 6) return "Password must be at least 6 characters.";
  return "";
}

export function validatePhone(v) {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "Enter your phone number.";
  if (digits.length < 10) return "Enter a valid phone number, e.g. 0300 1234567.";
  return "";
}

export function validateRequired(v, fieldName) {
  if (!v || !v.trim()) return `Enter your ${fieldName.toLowerCase()}.`;
  return "";
}

// Mock Network Handlers
export function mockLoginRequest(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (password === "wrongpass") {
        reject(new Error("Incorrect email or password. Please try again."));
      } else {
        const lower = email.toLowerCase();
        let role = "BUYER";
        let name = email.split("@")[0];
        if (lower.includes("admin")) {
          role = "ADMIN";
          name = "System Admin";
        } else if (lower.includes("seller")) {
          role = "SELLER";
          name = "Faisalabad Textiles";
        }
        resolve({
          id: `usr-${Date.now()}`,
          name,
          email,
          role,
        });
      }
    }, 400);
  });
}

export function mockForgotRequest(email) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email.trim().toLowerCase() === "unknown@company.com") {
        reject(new Error("No account found with this email address. Please check and try again."));
      } else {
        resolve({ email });
      }
    }, 700);
  });
}

export function mockRegisterBuyerRequest(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data.email.trim().toLowerCase() === "taken@company.com") {
        reject(new Error("An account with this email address already exists. Please log in instead."));
      } else {
        resolve({ name: data.fullName, email: data.email });
      }
    }, 800);
  });
}

export function mockRegisterSellerRequest(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data.bizPhone.replace(/\D/g, "") === "03000000000") {
        reject(new Error("Verification failed for this phone number. Please contact support."));
      } else {
        const refId = "SUP-" + Math.floor(100000 + Math.random() * 900000);
        resolve({ refId, bizName: data.bizName });
      }
    }, 900);
  });
}
