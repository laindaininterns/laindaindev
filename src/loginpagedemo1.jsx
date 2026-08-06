import { useState, useRef, useEffect } from "react";

// Design System Tokens (as specified in design.md & laindainapproveddesign.html)
const TOKENS = {
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

// Regex Validation Patterns
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v) {
  if (!v.trim()) return "Enter your email address to continue.";
  if (!EMAIL_RE.test(v.trim())) return "Enter a valid email address, e.g. you@company.com.";
  return "";
}

function validatePassword(v) {
  if (!v) return "Enter your password to continue.";
  if (v.length < 6) return "Password must be at least 6 characters.";
  return "";
}

function validatePhone(v) {
  const digits = v.replace(/\D/g, "");
  if (!digits) return "Enter your phone number.";
  if (digits.length < 10) return "Enter a valid phone number, e.g. 0300 1234567.";
  return "";
}

function validateRequired(v, fieldName) {
  if (!v || !v.trim()) return `Enter your ${fieldName.toLowerCase()}.`;
  return "";
}

// Mock Async Request Handlers (Simulates network requests and provides preview error hooks)
function mockLoginRequest(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (password === "wrongpass") {
        reject(new Error("Incorrect email or password. Please try again."));
      } else {
        resolve({ name: email.split("@")[0], email });
      }
    }, 800);
  });
}

function mockForgotRequest(email) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email.trim().toLowerCase() === "unknown@company.com") {
        reject(new Error("No account found with this email address. Please check and try again."));
      } else {
        resolve({ email });
      }
    }, 800);
  });
}

function mockRegisterBuyerRequest(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data.email.trim().toLowerCase() === "taken@company.com") {
        reject(new Error("An account with this email address already exists. Please log in instead."));
      } else {
        resolve({ name: data.fullName, email: data.email });
      }
    }, 900);
  });
}

function mockRegisterSellerRequest(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data.bizPhone.replace(/\D/g, "") === "03000000000") {
        reject(new Error("Verification failed for this phone number. Please contact support."));
      } else {
        const refId = "SUP-" + Math.floor(100000 + Math.random() * 900000);
        resolve({ refId, bizName: data.bizName });
      }
    }, 1000);
  });
}

// --- Micro Components ---
function Hint({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] font-normal leading-tight text-[#C6564D]">{message}</p>;
}

function AlertBox({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-[12px] px-4 py-3 text-[13px] leading-relaxed transition-all"
      style={{
        color: "#C6564D",
        background: "rgba(198, 86, 77, 0.06)",
        border: "1px solid rgba(198, 86, 77, 0.3)",
      }}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] flex-shrink-0 mt-0.5" fill="none" stroke="#C6564D" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>{message}</div>
    </div>
  );
}

function EyeIcon({ show }) {
  return show ? (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="#000" strokeWidth="1.7">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.4 5.5A9.6 9.6 0 0 1 12 5c5 0 9 4.5 10 7-.4 1.1-1.2 2.5-2.3 3.7M6.3 6.3C4.4 7.6 3 9.4 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="#000" strokeWidth="1.7">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Categories & Products Data
const CATEGORIES = [
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

const CAT_ICONS = {
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

const INITIAL_PRODUCTS = [
  { id: 1, name: "Faisalabad Textiles Co.", cat: "Clothing & Apparel", desc: "Cotton fabric rolls, wholesale bundles.", price: 850, verified: true },
  { id: 2, name: "Lahore Ceramics Hub", cat: "Tiles & Construction", desc: "Glazed ceramic floor tiles, 60x60cm.", price: 1200, verified: true },
  { id: 3, name: "Karachi Steel Traders", cat: "Home Appliances & Electronics", desc: "Stainless steel kitchen appliances.", price: 3400, verified: true },
  { id: 4, name: "Gujranwala Leather Works", cat: "Footwear", desc: "Genuine leather formal shoes, bulk pairs.", price: 1650, verified: true },
  { id: 5, name: "Sialkot Bags & Co.", cat: "Bags & Luggage", desc: "Canvas duffel bags and backpacks.", price: 980, verified: false },
  { id: 6, name: "Punjab AgroChem", cat: "Agriculture & Fertilizers", desc: "NPK fertilizer, 50kg sacks.", price: 2200, verified: true },
  { id: 7, name: "Multan Paints Ltd.", cat: "Paints & Chemicals", desc: "Weatherproof exterior emulsion paint.", price: 1450, verified: true },
  { id: 8, name: "Hyderabad Home Textiles", cat: "Bedding & Home Textiles", desc: "Cotton bedsheet sets, king size.", price: 1100, verified: false },
  { id: 9, name: "Islamabad Beauty Supplies", cat: "Cosmetics & Personal Care", desc: "Skincare range, retail-ready packs.", price: 760, verified: true },
  { id: 10, name: "Rawalpindi Sanitary Co.", cat: "Sanitary & Bathroom Fittings", desc: "Chrome bathroom fixtures and taps.", price: 1900, verified: true },
  { id: 11, name: "Karachi Cotton Mills", cat: "Clothing & Apparel", desc: "Unstitched lawn fabric, printed.", price: 640, verified: true },
  { id: 12, name: "Lahore Footwear Traders", cat: "Footwear", desc: "Rubber sole sandals, assorted sizes.", price: 520, verified: false },
];

// Main Application Component
export default function LainDainApp() {
  // Navigation & User state
  const [currentUser, setCurrentUser] = useState(null); // { name, email, role }
  const [showAuthModal, setShowAuthModal] = useState(true); // Open modal popup by default on page load!
  const [authScreen, setAuthScreen] = useState("login"); // login | forgot_password | register_buyer | register_seller
  
  // Landing Page state
  const [activeCategory, setActiveCategory] = useState("All Suppliers");
  const [quantities, setQuantities] = useState({ 1: 10, 2: 10, 3: 5, 4: 12, 5: 15, 6: 20, 7: 8, 8: 10, 9: 25, 10: 6, 11: 30, 12: 20 });
  const [cart, setCart] = useState({}); // productId -> { product, qty }
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("form"); // form | success
  const [checkoutOrderNum, setCheckoutOrderNum] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", tone: "success" });

  const toastTimer = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function fireToast(message, tone = "success") {
    setToast({ show: true, message, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2800);
  }

  function openAuth(screen = "login") {
    setAuthScreen(screen);
    setShowAuthModal(true);
  }

  function handleLoginSuccess(userObj) {
    setCurrentUser(userObj);
    setShowAuthModal(false);
    fireToast(`Welcome back to LainDain, ${userObj.name}!`, "success");
  }

  function handleRegisterSuccess(userObj) {
    setCurrentUser(userObj);
    setShowAuthModal(false);
    fireToast(`Account created! Welcome to LainDain, ${userObj.name}.`, "success");
  }

  function handleLogout() {
    setCurrentUser(null);
    fireToast("Logged out successfully.");
  }

  function updateQuantity(id, delta) {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const updated = Math.max(1, current + delta);
      return { ...prev, [id]: updated };
    });
  }

  function addToCart(product) {
    const qty = quantities[product.id] || 10;
    setCart((prev) => ({
      ...prev,
      [product.id]: { product, qty },
    }));
    fireToast(`Added ${product.name} (Qty: ${qty}) to cart`);
  }

  function removeFromCart(productId) {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  }

  const cartItems = Object.values(cart);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.qty, 0);

  function handlePlaceOrder(e) {
    e.preventDefault();
    const orderNum = "MKT-" + Math.floor(100000 + Math.random() * 900000);
    setCheckoutOrderNum(orderNum);
    setCheckoutStep("success");
    setCart({});
    fireToast(`Order #${orderNum} placed successfully!`);
  }

  // Filtered Products
  const filteredProducts = INITIAL_PRODUCTS.filter((p) => {
    const matchesCategory = activeCategory === "All Suppliers" || p.cat === activeCategory;
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase()) || p.cat.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col antialiased text-black selection:bg-[#A3C1BF] selection:text-black bg-[#F9F9F6]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      
      {/* ==================== STICKY NAVBAR ==================== */}
      <header
        className="sticky top-0 z-[200] h-16 flex items-center transition-all duration-250 border-b"
        style={{
          background: scrolled ? "rgba(249,249,246,0.92)" : TOKENS.offWhite,
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderColor: scrolled ? TOKENS.border : "transparent",
        }}
      >
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-2.5 font-semibold text-[18px] tracking-tight">
            <span
              className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[8px] text-[12px] font-bold"
              style={{ background: TOKENS.sage }}
            >
              LD
            </span>
            <span>LainDain</span>
          </a>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOverlayOpen(true)}
              aria-label="Search marketplace"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E9E8E2] bg-white hover:bg-[#EEF3F2] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="#000" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* User Auth Buttons / Profile status */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EEF3F2] text-[13px] font-medium border border-[#E9E8E2]">
                  👤 {currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-full text-[13px] font-medium text-[#C6564D] hover:bg-red-50 border border-transparent transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth("login")}
                  className="px-3.5 py-1.5 rounded-[12px] text-[13px] font-medium text-black hover:bg-black/5 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuth("register_buyer")}
                  className="hidden sm:inline-flex px-3.5 py-1.5 rounded-[12px] text-[13px] font-medium text-black hover:bg-black/5 transition-colors border border-[#E9E8E2]"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => openAuth("register_seller")}
                  className="hidden md:inline-flex h-[38px] items-center justify-center rounded-[12px] px-4 text-[13px] font-medium transition-all active:scale-[0.97]"
                  style={{ background: TOKENS.sage }}
                >
                  Register as Seller
                </button>
              </div>
            )}

            {/* Wholesale Cart Trigger */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              aria-label="Wholesale cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E9E8E2] bg-white hover:bg-[#EEF3F2] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="#000" strokeWidth="1.8">
                <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 7H6" />
                <circle cx="9.5" cy="20.5" r="1.2" />
                <circle cx="17.5" cy="20.5" r="1.2" />
              </svg>
              {cartItems.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-black"
                  style={{ background: TOKENS.sage }}
                >
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ==================== STICKY CATEGORY BAR ==================== */}
      <nav aria-label="Shop by category" className="sticky top-16 z-[190] border-b border-[#E9E8E2] bg-[#F9F9F6]">
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-[999px] text-[13px] font-medium transition-all ${
                    active ? "bg-black text-white shadow-sm" : "bg-transparent text-[#5B5B58] hover:text-black hover:bg-black/5"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 mx-auto w-full max-w-[1240px] px-4 md:px-8 py-6">
        {/* Intro Strip */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px] md:text-[28px] font-semibold text-black tracking-tight">Stock Your Inventory</h1>
            <p className="text-[13px] text-[#5B5B58]">Browse verified wholesale manufacturers, importers, & distributors.</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#EEF3F2] text-[12px] font-medium text-[#5B5B58] border border-[#E9E8E2]">
            {filteredProducts.length * 11 + 6} verified suppliers
          </span>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            const qty = quantities[p.id] || 10;
            return (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-[20px] bg-white border border-[#E9E8E2] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-[#85A6A3]"
              >
                <div>
                  <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#EEF3F2] text-[20px] mb-3">
                    {CAT_ICONS[p.cat] || "📦"}
                  </div>
                  <h3 className="text-[15px] font-semibold text-black leading-snug">{p.name}</h3>
                  
                  <div className="mt-1 flex items-center gap-1.5">
                    {p.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85A6A3]">
                        <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="#85A6A3" strokeWidth="2.5">
                          <polyline points="4 13 9 18 20 6" />
                        </svg>
                        Verified Supplier
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[#5B5B58]">Unverified</span>
                    )}
                  </div>

                  <p className="mt-2 text-[12px] text-[#5B5B58] line-clamp-2">{p.desc}</p>
                  
                  <div className="mt-3 flex items-center justify-between border-t border-[#E9E8E2] pt-3 text-[12px]">
                    <span className="font-medium text-black">Rs. {p.price.toLocaleString()} / unit</span>
                    <span className="rounded-full bg-[#F9F9F6] px-2 py-0.5 text-[10px] font-medium text-[#5B5B58]">{p.cat}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E9E8E2]">
                  {/* Min Order Stepper */}
                  <div className="flex items-center justify-between text-[12px] text-[#5B5B58] mb-2.5">
                    <span>Min Order</span>
                    <div className="flex items-center gap-1 bg-[#F9F9F6] border border-[#E9E8E2] rounded-[8px] p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(p.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-[6px] hover:bg-white text-black font-semibold"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-[12px] font-medium text-black">{qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(p.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-[6px] hover:bg-white text-black font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Add to Wholesale Cart */}
                  <button
                    onClick={() => addToCart(p)}
                    className="w-full flex h-[40px] items-center justify-center rounded-[12px] text-[13px] font-medium transition-all active:scale-[0.98]"
                    style={{ background: TOKENS.sage, color: TOKENS.black }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = TOKENS.sageDark)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = TOKENS.sage)}
                  >
                    Add to Wholesale Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More Strip */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => fireToast("You're all caught up — no more suppliers to load.")}
            className="px-6 py-2.5 rounded-[12px] bg-white border border-[#E9E8E2] text-[13px] font-medium text-black hover:bg-[#EEF3F2] transition-colors"
          >
            Load more ↓
          </button>
        </div>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="mt-16 border-t border-[#E9E8E2] bg-white py-10 text-[13px] text-[#5B5B58]">
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <a href="#" className="flex items-center gap-2 font-semibold text-[16px] text-black">
                <span className="inline-flex h-[24px] w-[24px] items-center justify-center rounded-[6px] text-[11px] font-bold bg-[#A3C1BF]">
                  LD
                </span>
                <span>LainDain</span>
              </a>
              <p className="mt-3 text-[12px] text-[#5B5B58] max-w-[220px] leading-relaxed">
                Pakistan's wholesale sourcing platform for verified B2B trade.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-3">Categories</h4>
              <ul className="space-y-2 text-[12px]">
                <li><a href="#" onClick={(e)=>{e.preventDefault(); setActiveCategory("Clothing & Apparel");}} className="hover:underline">Clothing & Apparel</a></li>
                <li><a href="#" onClick={(e)=>{e.preventDefault(); setActiveCategory("Footwear");}} className="hover:underline">Footwear</a></li>
                <li><a href="#" onClick={(e)=>{e.preventDefault(); setActiveCategory("Bedding & Home Textiles");}} className="hover:underline">Home Textiles</a></li>
                <li><a href="#" onClick={(e)=>{e.preventDefault(); setActiveCategory("All Suppliers");}} className="hover:underline">All Categories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-3">Company</h4>
              <ul className="space-y-2 text-[12px]">
                <li><a href="#" className="hover:underline">How It Works</a></li>
                <li><a href="#" onClick={(e)=>{e.preventDefault(); openAuth("register_seller");}} className="hover:underline">Sell on LainDain</a></li>
                <li><a href="#" className="hover:underline">About Us</a></li>
                <li><a href="#" className="hover:underline">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-3">Support</h4>
              <ul className="space-y-2 text-[12px]">
                <li><a href="#" className="hover:underline">Help Centre</a></li>
                <li><a href="#" className="hover:underline">Buyer Protection</a></li>
                <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:underline">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E9E8E2] flex flex-col sm:flex-row items-center justify-between text-[12px]">
            <span>© 2026 LainDain. All rights reserved.</span>
            <span>Made for Pakistani businesses 🇵🇰</span>
          </div>
        </div>
      </footer>

      {/* ==================== SEARCH OVERLAY ==================== */}
      {searchOverlayOpen && (
        <div
          className="fixed inset-0 z-[400] flex items-start justify-center pt-16 bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOverlayOpen(false);
          }}
        >
          <div className="w-full max-w-[560px] rounded-[20px] bg-white p-5 shadow-2xl border border-[#E9E8E2] animate-in fade-in zoom-in-95 duration-150">
            <div className="relative flex items-center border-b border-[#E9E8E2] pb-3">
              <svg viewBox="0 0 24 24" className="h-[20px] w-[20px] text-[#5B5B58] ml-1 mr-3" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers, products, or cities..."
                className="w-full text-[15px] outline-none placeholder:text-[#5B5B58] bg-transparent"
              />
              <button
                onClick={() => setSearchOverlayOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B5B58] block mb-2">Popular Categories</span>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.slice(1, 7).map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setActiveCategory(c);
                      setSearchOverlayOpen(false);
                    }}
                    className="px-3 py-1 rounded-full bg-[#EEF3F2] text-[12px] font-medium text-black hover:bg-[#A3C1BF] transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CART DRAWER ==================== */}
      {cartDrawerOpen && (
        <div
          className="fixed inset-0 z-[450] bg-black/50 backdrop-blur-sm flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCartDrawerOpen(false);
          }}
        >
          <div className="w-full max-w-[400px] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-[#E9E8E2] flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-black">Wholesale Cart</h3>
              <button onClick={() => setCartDrawerOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-[#5B5B58]">
                  <div className="text-[36px] mb-2">🛒</div>
                  <p className="text-[14px] font-medium text-black">Your wholesale cart is empty</p>
                  <p className="text-[12px] mt-1">Browse verified suppliers to get started.</p>
                </div>
              ) : (
                cartItems.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-start gap-3 p-3 rounded-[14px] bg-[#F9F9F6] border border-[#E9E8E2]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-[18px] border border-[#E9E8E2]">
                      {CAT_ICONS[product.cat] || "📦"}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[13px] font-semibold text-black">{product.name}</h4>
                      <p className="text-[11px] text-[#5B5B58]">Qty {qty} · Rs. {(product.price * qty).toLocaleString()}</p>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="mt-1 text-[11px] text-[#C6564D] hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t border-[#E9E8E2] bg-white">
              <div className="flex items-center justify-between text-[14px] font-semibold mb-4">
                <span>Subtotal (excl. tax)</span>
                <span>Rs. {cartSubtotal.toLocaleString()}</span>
              </div>
              <button
                disabled={cartItems.length === 0}
                onClick={() => {
                  setCartDrawerOpen(false);
                  setCheckoutStep("form");
                  setCheckoutModalOpen(true);
                }}
                className={`w-full h-[46px] rounded-[14px] text-[14px] font-medium transition-all ${
                  cartItems.length > 0 ? "bg-[#A3C1BF] text-black hover:bg-[#85A6A3]" : "bg-[#E9E8E2] text-[#5B5B58] cursor-not-allowed"
                }`}
              >
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CHECKOUT MODAL ==================== */}
      {checkoutModalOpen && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCheckoutModalOpen(false);
          }}
        >
          <div className="w-full max-w-[480px] rounded-[24px] bg-white p-6 shadow-2xl border border-[#E9E8E2]">
            {checkoutStep === "form" ? (
              <form onSubmit={handlePlaceOrder}>
                <div className="flex items-center justify-between pb-3 border-b border-[#E9E8E2] mb-4">
                  <h3 className="text-[16px] font-semibold text-black">Wholesale Checkout</h3>
                  <button type="button" onClick={() => setCheckoutModalOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5">
                    ✕
                  </button>
                </div>

                <div className="mb-4 rounded-[12px] bg-[#EEF3F2] p-3 text-[13px] flex justify-between font-medium">
                  <span>Total Order Amount</span>
                  <span>Rs. {cartSubtotal.toLocaleString()}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[12px] font-medium mb-1">Business Name</label>
                    <input required defaultValue={currentUser?.name ? `${currentUser.name} Enterprise` : ""} type="text" placeholder="e.g. Faisalabad Traders" className="w-full h-[40px] px-3 rounded-[10px] border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium mb-1">Contact Person</label>
                      <input required defaultValue={currentUser?.name || ""} type="text" placeholder="Full name" className="w-full h-[40px] px-3 rounded-[10px] border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium mb-1">Phone</label>
                      <input required type="tel" placeholder="03XX XXXXXXX" className="w-full h-[40px] px-3 rounded-[10px] border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1">City & Delivery Address</label>
                    <input required type="text" placeholder="e.g. Goods Transport Plaza, Badami Bagh, Lahore" className="w-full h-[40px] px-3 rounded-[10px] border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full h-[46px] rounded-[14px] bg-[#A3C1BF] text-black font-medium text-[14px] hover:bg-[#85A6A3] transition-colors"
                >
                  Place Order →
                </button>
              </form>
            ) : (
              <div className="py-6 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#A3C1BF]">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#000" strokeWidth="2.5">
                    <polyline points="4 13 9 18 20 6" />
                  </svg>
                </div>
                <h3 className="text-[20px] font-semibold text-black">Order Placed Successfully!</h3>
                <p className="mt-1 text-[13px] text-[#5B5B58]">Your wholesale order reference: <strong className="text-black">{checkoutOrderNum}</strong></p>
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="mt-6 w-full h-[44px] rounded-[14px] bg-black text-white font-medium text-[13px] hover:bg-black/80"
                >
                  Continue Browsing Marketplace
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== AUTHENTICATION MODAL POPUP ==================== */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAuthModal(false);
          }}
        >
          <div className="relative w-full max-w-[460px] rounded-[24px] bg-white border border-[#E9E8E2] shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden my-8">
            
            {/* Top Modal Navigation Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#E9E8E2] bg-[#F9F9F6]">
              <div className="flex items-center gap-1.5 bg-[#EEF3F2] p-1 rounded-full border border-[#E9E8E2]">
                <button
                  onClick={() => setAuthScreen("login")}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    authScreen === "login" ? "bg-black text-white" : "text-[#5B5B58] hover:text-black"
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => setAuthScreen("register_buyer")}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    authScreen === "register_buyer" ? "bg-black text-white" : "text-[#5B5B58] hover:text-black"
                  }`}
                >
                  Buyer
                </button>
                <button
                  onClick={() => setAuthScreen("register_seller")}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    authScreen === "register_seller" ? "bg-black text-white" : "text-[#5B5B58] hover:text-black"
                  }`}
                >
                  Seller
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowAuthModal(false)}
                title="Close modal"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/10 text-black transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Auth Screen Render */}
            <div className="p-6">
              {authScreen === "login" && (
                <LoginScreen
                  switchScreen={setAuthScreen}
                  onLoginSuccess={handleLoginSuccess}
                  fireToast={fireToast}
                  closeModal={() => setShowAuthModal(false)}
                />
              )}
              {authScreen === "forgot_password" && (
                <ForgotPasswordScreen
                  switchScreen={setAuthScreen}
                  fireToast={fireToast}
                />
              )}
              {authScreen === "register_buyer" && (
                <RegisterBuyerScreen
                  switchScreen={setAuthScreen}
                  onRegisterSuccess={handleRegisterSuccess}
                  fireToast={fireToast}
                />
              )}
              {authScreen === "register_seller" && (
                <RegisterSellerScreen
                  switchScreen={setAuthScreen}
                  fireToast={fireToast}
                  closeModal={() => setShowAuthModal(false)}
                />
              )}
            </div>

            {/* Bottom Modal Actions: Skip / Guest button */}
            <div className="px-6 py-3.5 bg-[#EEF3F2] border-t border-[#E9E8E2] flex items-center justify-between">
              <span className="text-[12px] text-[#5B5B58]">Want to explore first?</span>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-[12px] font-semibold text-black underline underline-offset-2 hover:text-[#5B5B58] transition-colors"
              >
                Continue as Guest (Skip) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 z-[600] flex items-center gap-2.5 rounded-[16px] px-5 py-3 text-[14px] font-medium text-white transition-all duration-250 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
        style={{
          background: toast.tone === "success" ? "#000000" : "#C6564D",
          opacity: toast.show ? 1 : 0,
          visibility: toast.show ? "visible" : "hidden",
          transform: `translate(-50%, ${toast.show ? "0" : "16px"})`,
        }}
      >
        {toast.tone === "success" ? (
          <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="#A3C1BF" strokeWidth="2.5">
            <polyline points="4 13 9 18 20 6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

// ==========================================
// 1. LOG IN SCREEN
// ==========================================
function LoginScreen({ switchScreen, onLoginSuccess, fireToast, closeModal }) {
  const [email, setEmail] = useState("demo@laindain.pk");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  function handleBlur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
    if (field === "email") setErrors((e) => ({ ...e, email: validateEmail(email) }));
    if (field === "password") setErrors((e) => ({ ...e, password: validatePassword(password) }));
  }

  function handleChange(field, value) {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (touched[field]) {
      setErrors((e) => ({
        ...e,
        [field]: field === "email" ? validateEmail(value) : validatePassword(value),
      }));
    }
    if (formError) setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setErrors({ email: emailErr, password: passwordErr });
    setTouched({ email: true, password: true });

    if (emailErr) {
      emailRef.current?.focus();
      return;
    }
    if (passwordErr) {
      passwordRef.current?.focus();
      return;
    }

    setStatus("loading");
    setFormError("");

    try {
      const user = await mockLoginRequest(email, password);
      setStatus("success");
      onLoginSuccess(user);
    } catch (err) {
      setStatus("idle");
      setFormError(err.message || "Failed to log in.");
    }
  }

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-[20px] font-semibold text-black">Log in to LainDain</h2>
        <p className="mt-1 text-[13px] text-[#5B5B58]">Enter your business credentials below.</p>
      </div>

      <AlertBox message={formError} />

      <form onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[12px] font-medium text-black">Email Address</label>
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="you@company.com"
            className="h-[44px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none transition-all"
            style={{
              border: `1px solid ${errors.email ? TOKENS.error : TOKENS.border}`,
            }}
          />
          <Hint message={errors.email} />
        </div>

        {/* Password Field */}
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-medium text-black">Password</label>
          <div className="relative">
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder="••••••••"
              className="h-[44px] w-full rounded-[14px] bg-white pl-3.5 pr-11 text-[13px] outline-none transition-all"
              style={{
                border: `1px solid ${errors.password ? TOKENS.error : TOKENS.border}`,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[8px] hover:bg-black/5"
            >
              <EyeIcon show={showPassword} />
            </button>
          </div>
          <Hint message={errors.password} />
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="mb-5 flex items-center justify-between text-[12px]">
          <label className="flex items-center gap-2 cursor-pointer text-[#5B5B58]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded"
              style={{ accentColor: TOKENS.sageDark }}
            />
            <span>Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => switchScreen("forgot_password")}
            className="font-medium text-black underline underline-offset-2 hover:text-[#5B5B58]"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex h-[44px] w-full items-center justify-center rounded-[14px] text-[14px] font-medium transition-all active:scale-[0.98]"
          style={{
            background: status === "loading" ? TOKENS.border : TOKENS.sage,
            color: status === "loading" ? TOKENS.textMuted : TOKENS.black,
            cursor: status === "loading" ? "not-allowed" : "pointer",
          }}
        >
          {status === "loading" ? "Logging in…" : "Log In →"}
        </button>
      </form>

      {/* Demo Credentials Box */}
      <div className="mt-4 rounded-[12px] bg-[#EEF3F2] p-3 text-[11px] text-[#5B5B58] border border-[#E9E8E2] space-y-0.5">
        <p className="font-semibold text-black">💡 Demo Credentials:</p>
        <p>• Email: <code>demo@laindain.pk</code> | Password: <code>password123</code></p>
        <p>• Error test: enter password <code>wrongpass</code></p>
      </div>
    </div>
  );
}

// ==========================================
// 2. FORGOT PASSWORD SCREEN
// ==========================================
function ForgotPasswordScreen({ switchScreen, fireToast }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleSubmit(e) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    setError(emailErr);
    setTouched(true);

    if (emailErr) return;

    setStatus("loading");
    setFormError("");

    try {
      await mockForgotRequest(email);
      setStatus("sent");
      fireToast("Password reset link sent!");
    } catch (err) {
      setStatus("idle");
      setFormError(err.message || "Failed to process request.");
    }
  }

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-[20px] font-semibold text-black">Forgot Password?</h2>
        <p className="mt-1 text-[13px] text-[#5B5B58]">
          Enter your email and we'll send you instructions to reset your password.
        </p>
      </div>

      <AlertBox message={formError} />

      {status === "sent" ? (
        <div className="text-center py-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3F2]">
            📧
          </div>
          <p className="text-[13px] text-[#5B5B58] mb-4">
            Reset link dispatched to <strong className="text-black">{email}</strong>. Please check your inbox.
          </p>
          <button
            type="button"
            onClick={() => switchScreen("login")}
            className="w-full h-[44px] rounded-[14px] bg-[#A3C1BF] text-black font-medium text-[13px]"
          >
            Return to Log In →
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-black">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched) setError(validateEmail(e.target.value));
              }}
              onBlur={() => {
                setTouched(true);
                setError(validateEmail(email));
              }}
              placeholder="you@company.com"
              className="h-[44px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none transition-all border border-[#E9E8E2]"
            />
            <Hint message={error} />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full h-[44px] rounded-[14px] bg-[#A3C1BF] text-black font-medium text-[14px] hover:bg-[#85A6A3] transition-colors"
          >
            {status === "loading" ? "Sending Reset Link…" : "Send Reset Link →"}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => switchScreen("login")}
              className="text-[12px] font-medium text-black underline underline-offset-2 hover:text-[#5B5B58]"
            >
              ← Back to Log In
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ==========================================
// 3. REGISTER BUYER SCREEN
// ==========================================
function RegisterBuyerScreen({ switchScreen, onRegisterSuccess, fireToast }) {
  const [formData, setFormData] = useState({
    fullName: "",
    bizName: "",
    email: "",
    password: "",
    industry: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");

  function handleChange(field, val) {
    setFormData((prev) => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {
      fullName: validateRequired(formData.fullName, "Full Name"),
      bizName: validateRequired(formData.bizName, "Business Name"),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };

    setErrors(errs);

    if (Object.values(errs).some((x) => x)) return;

    setStatus("loading");
    setFormError("");

    try {
      const res = await mockRegisterBuyerRequest(formData);
      onRegisterSuccess(res);
    } catch (err) {
      setStatus("idle");
      setFormError(err.message || "Registration failed.");
    }
  }

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-[20px] font-semibold text-black">Register as Buyer</h2>
        <p className="mt-1 text-[13px] text-[#5B5B58]">Access wholesale pricing from verified suppliers.</p>
      </div>

      <AlertBox message={formError} />

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-black mb-1">Full Name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="e.g. Tariq Mehmood"
            className="h-[40px] w-full rounded-[12px] border border-[#E9E8E2] px-3 text-[13px] outline-none"
          />
          <Hint message={errors.fullName} />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-black mb-1">Business Name</label>
          <input
            type="text"
            value={formData.bizName}
            onChange={(e) => handleChange("bizName", e.target.value)}
            placeholder="e.g. Mehmood Retailers"
            className="h-[40px] w-full rounded-[12px] border border-[#E9E8E2] px-3 text-[13px] outline-none"
          />
          <Hint message={errors.bizName} />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-black mb-1">Business Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="you@company.com"
            className="h-[40px] w-full rounded-[12px] border border-[#E9E8E2] px-3 text-[13px] outline-none"
          />
          <Hint message={errors.email} />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-black mb-1">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="••••••••"
            className="h-[40px] w-full rounded-[12px] border border-[#E9E8E2] px-3 text-[13px] outline-none"
          />
          <Hint message={errors.password} />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-4 w-full h-[44px] rounded-[14px] bg-[#A3C1BF] text-black font-medium text-[14px] hover:bg-[#85A6A3] transition-colors"
        >
          {status === "loading" ? "Creating Account…" : "Create Buyer Account →"}
        </button>
      </form>
    </div>
  );
}

// ==========================================
// 4. REGISTER SELLER SCREEN (2-STEP)
// ==========================================
function RegisterSellerScreen({ switchScreen, fireToast, closeModal }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bizName: "",
    bizType: "Manufacturer",
    bizPhone: "",
    bizContact: "",
    bizEmail: "",
    bizIndustry: "Clothing & Apparel",
    bizDesc: "",
    bizWebsite: "",
    bizYear: "2018",
    bizAddress: "",
    bizEmployees: "50–200",
    uploadedFile: null,
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");
  const [successData, setSuccessData] = useState(null);

  function handleChange(field, val) {
    setFormData((prev) => ({ ...prev, [field]: val }));
  }

  function handleStep1Next(e) {
    e.preventDefault();
    const nameErr = validateRequired(formData.bizName, "Business Name");
    const phoneErr = validatePhone(formData.bizPhone);

    setErrors({ bizName: nameErr, bizPhone: phoneErr });

    if (nameErr || phoneErr) return;
    setStep(2);
  }

  async function handleSubmitApp() {
    setStatus("loading");
    setFormError("");

    try {
      const res = await mockRegisterSellerRequest(formData);
      setStatus("success");
      setSuccessData(res);
      fireToast("Seller Application Submitted!");
    } catch (err) {
      setStatus("idle");
      setFormError(err.message || "Application submission failed.");
    }
  }

  return (
    <div>
      {status === "success" ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#A3C1BF]">
            ✓
          </div>
          <h3 className="text-[18px] font-semibold text-black">Application Received!</h3>
          <p className="text-[12px] text-[#5B5B58] mt-1 mb-4">
            Reference ID: <strong className="text-black">{successData?.refId}</strong>. We'll review your details within 48 hours.
          </p>
          <button
            onClick={closeModal}
            className="w-full h-[42px] rounded-[12px] bg-black text-white text-[13px] font-medium"
          >
            Done
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E9E8E2]">
            <span className="text-[12px] font-semibold text-[#85A6A3]">Step {step} of 2</span>
            <span className="text-[12px] text-[#5B5B58]">{step === 1 ? "Business Details" : "Verification"}</span>
          </div>

          <AlertBox message={formError} />

          {step === 1 ? (
            <form onSubmit={handleStep1Next} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-black mb-1">Business Name</label>
                <input
                  type="text"
                  value={formData.bizName}
                  onChange={(e) => handleChange("bizName", e.target.value)}
                  placeholder="e.g. Faisalabad Textiles Co."
                  className="h-[40px] w-full rounded-[12px] border border-[#E9E8E2] px-3 text-[13px] outline-none"
                />
                <Hint message={errors.bizName} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-black mb-1">Business Type</label>
                  <select
                    value={formData.bizType}
                    onChange={(e) => handleChange("bizType", e.target.value)}
                    className="h-[40px] w-full rounded-[12px] border border-[#E9E8E2] px-2 text-[12px] outline-none"
                  >
                    <option>Manufacturer</option>
                    <option>Importer</option>
                    <option>Brand Owner</option>
                    <option>Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-black mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.bizPhone}
                    onChange={(e) => handleChange("bizPhone", e.target.value)}
                    placeholder="03XX XXXXXXX"
                    className="h-[40px] w-full rounded-[12px] border border-[#E9E8E2] px-3 text-[13px] outline-none"
                  />
                  <Hint message={errors.bizPhone} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-black mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.bizContact}
                    onChange={(e) => handleChange("bizContact", e.target.value)}
                    placeholder="Full Name"
                    className="h-[40px] w-full rounded-[12px] border border-[#E9E8E2] px-3 text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-black mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.bizEmail}
                    onChange={(e) => handleChange("bizEmail", e.target.value)}
                    placeholder="you@company.com"
                    className="h-[40px] w-full rounded-[12px] border border-[#E9E8E2] px-3 text-[13px] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 w-full h-[44px] rounded-[14px] bg-[#A3C1BF] text-black font-medium text-[14px] hover:bg-[#85A6A3] transition-colors"
              >
                Continue to Step 2 →
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-black mb-1">Head Office Address</label>
                <input
                  type="text"
                  value={formData.bizAddress}
                  onChange={(e) => handleChange("bizAddress", e.target.value)}
                  placeholder="e.g. Canal Road, Faisalabad"
                  className="h-[40px] w-full rounded-[12px] border border-[#E9E8E2] px-3 text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-black mb-1">Proof of Business (NTN / Sales Tax)</label>
                <div
                  onClick={() => handleChange("uploadedFile", "NTN_Document.pdf")}
                  className="border-2 border-dashed border-[#E9E8E2] rounded-[12px] p-4 text-center cursor-pointer hover:border-[#85A6A3] bg-[#F9F9F6]"
                >
                  <span className="text-[12px] text-[#5B5B58]">
                    {formData.uploadedFile ? `📄 ${formData.uploadedFile}` : "Tap to upload document (PDF, JPG)"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-[42px] rounded-[12px] border border-[#E9E8E2] text-[13px] font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmitApp}
                  disabled={status === "loading"}
                  className="flex-1 h-[42px] rounded-[12px] bg-[#A3C1BF] text-black text-[13px] font-medium hover:bg-[#85A6A3]"
                >
                  {status === "loading" ? "Submitting…" : "Submit Application →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}