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
  "Bedding & Home Textiles": "🛏️",
  "Cosmetics & Personal Care": "💄",
  "Tiles & Construction": "🧱",
  "Sanitary & Bathroom Fittings": "🚿",
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

// Initial Suppliers / Products Dataset (Starts empty for live database fetching)
export const PRODUCTS = [];

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
        resolve({ name: email.split("@")[0], email });
      }
    }, 700);
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
