import React, { useState, useEffect, lazy, Suspense } from "react";
import { PRODUCTS, CATEGORIES, TOKENS } from "./data/marketplaceData";
import { fetchSellerProductsRequest } from "./services/api";
import Navbar from "./components/Navbar";
import CategoryBar from "./components/CategoryBar";
import ProductCard from "./components/ProductCard";
import Toast from "./components/Toast";
import NotFoundPage from "./components/NotFoundPage";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const ProductDetailModal = lazy(() => import("./components/ProductDetailModal"));
const CartDrawer = lazy(() => import("./components/CartDrawer"));
const CheckoutModal = lazy(() => import("./components/CheckoutModal"));
const SearchOverlay = lazy(() => import("./components/SearchOverlay"));
const AuthModal = lazy(() => import("./components/auth/AuthModal"));
const ChatWidget = lazy(() => import("./components/chatbot/ChatWidget"));
const SellerDashboard = lazy(() => import("./components/seller-dashboard/SellerDashboard"));

import { fetchAdminSummary, fetchAllSellers, fetchAdminProductsCatalog, fetchBuyersDirectory, fetchPendingSellers } from "./services/api";

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState("marketplace"); // 'marketplace', 'admin', or 'seller'
  const [adminTab, setAdminTab] = useState("summary");
  const [pendingCount, setPendingCount] = useState(0);

  // App state
  const [activeCategory, setActiveCategory] = useState("All Suppliers");
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(true); // Pops up initially
  const [authInitialScreen, setAuthInitialScreen] = useState("login");

  // Modals & Overlays state
  const [selectedProduct, setSelectedProduct] = useState(null); // ProductDetailModal
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [isSellerDashboardOpen, setIsSellerDashboardOpen] = useState(false);

  // Cart State (map by product id + color)
  const [cart, setCart] = useState({});

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", tone: "success" });

  // Pre-fetch all admin dashboard tab data in parallel when entering Admin view for 0ms instant switching
  useEffect(() => {
    if (currentView === "admin") {
      Promise.all([
        fetchAdminSummary(),
        fetchAllSellers(),
        fetchAdminProductsCatalog(),
        fetchBuyersDirectory(),
        fetchPendingSellers(),
      ])
        .then(([summaryData, sellersData, productsData, buyersData, pendingData]) => {
          if (pendingData) setPendingCount(pendingData.length);
        })
        .catch((err) => console.warn("Admin pre-fetch error:", err));
    }
  }, [currentView]);



  // Route Guard & Session Persistence on Mount
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedSession = localStorage.getItem("user_session");
    const pathname = window.location.pathname;

    let parsedUser = null;
    if (savedSession) {
      try {
        parsedUser = JSON.parse(savedSession);
        setCurrentUser(parsedUser);
      } catch (err) {
        console.warn("Failed to parse saved session:", err);
      }
    }

    const isAdminRoute = pathname.startsWith("/admin");
    const isSellerRoute = pathname.startsWith("/seller");

    if (isAdminRoute) {
      if (savedToken && parsedUser?.role === "ADMIN") {
        setCurrentView("admin");
        setShowAuthModal(false);
        const targetTab = pathname.split("/admin/")[1];
        if (targetTab && ["summary", "approvals", "sellers", "buyers", "products"].includes(targetTab)) {
          setAdminTab(targetTab);
        }
      } else {
        setCurrentView("marketplace");
        setShowAuthModal(true);
        setAuthInitialScreen("login");
        triggerToast("Access denied. Admin authentication required.", "error");
      }
    } else if (isSellerRoute) {
      if (savedToken && parsedUser?.role === "SELLER") {
        setCurrentView("seller");
        setShowAuthModal(false);
      } else {
        setCurrentView("marketplace");
        setShowAuthModal(true);
        setAuthInitialScreen("login");
        triggerToast("Access denied. Seller authentication required.", "error");
      }
    } else if (savedToken && parsedUser?.role === "ADMIN") {
      setShowAuthModal(false);
    } else if (savedToken && parsedUser?.role === "SELLER") {
      setShowAuthModal(false);
    } else if (savedToken && parsedUser) {
      setShowAuthModal(false);
    }
  }, []);

=======
>>>>>>> mohsin/backend-seller
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      document.title = `${selectedProduct.name} | LainDain Wholesale`;
    } else if (activeCategory && activeCategory !== "All Suppliers") {
      document.title = `${activeCategory} Suppliers | LainDain (Land10)`;
    } else {
      document.title = "LainDain (Land10) — B2B Wholesale Marketplace";
    }
  }, [selectedProduct, activeCategory]);

  function triggerToast(message, tone = "success") {
    setToast({ show: true, message, tone });
    setTimeout(() => setToast({ show: false, message: "", tone: "success" }), 2800);
  }

  // Handle Adding to Cart from Product Detail Modal
  function handleAddToCart(itemWithQty) {
    const key = `${itemWithQty.id}-${itemWithQty.selectedColor || "default"}`;
    setCart((prev) => {
      const existing = prev[key];
      const newQty = existing ? existing.qty + itemWithQty.qty : itemWithQty.qty;
      return {
        ...prev,
        [key]: { ...itemWithQty, qty: newQty },
      };
    });
    triggerToast(`Added ${itemWithQty.qty} units of ${itemWithQty.name} to cart!`);
  }

  // Handle Cart Quantity Increment/Decrement
  function handleUpdateCartQty(item, delta) {
    const key = `${item.id}-${item.selectedColor || "default"}`;
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      const step = item.moq || 5;
      const newQty = existing.qty + delta * step;
      if (newQty < (item.moq || 1)) {
        const nextCart = { ...prev };
        delete nextCart[key];
        return nextCart;
      }
      return {
        ...prev,
        [key]: { ...existing, qty: newQty },
      };
    });
  }

  // Handle Cart Item Removal
  function handleRemoveCartItem(item) {
    const key = `${item.id}-${item.selectedColor || "default"}`;
    setCart((prev) => {
      const nextCart = { ...prev };
      delete nextCart[key];
      return nextCart;
    });
    triggerToast(`Removed ${item.name} from cart`, "info");
  }

  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    async function loadLiveMarketplaceProducts() {
      try {
        const live = await fetchSellerProductsRequest();
        if (Array.isArray(live)) {
          setProductsList(live);
        }
      } catch (err) {
        console.error('Failed to load marketplace products from database:', err.message);
      }
    }
    loadLiveMarketplaceProducts();
  }, []);

  // Compute Filtered Products
  const filteredProducts =
    activeCategory === "All Suppliers"
      ? productsList
      : productsList.filter((p) => p.cat === activeCategory);

  // Compute Search Results
  const searchResults = searchQuery.trim()
    ? productsList.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Compute Cart Calculations
  const cartItems = Object.values(cart);
  const cartCount = cartItems.length;
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Auth Handlers
  function handleLoginSuccess(user) {
    setCurrentUser(user);
    setShowAuthModal(false);
    triggerToast(`Welcome back, ${user.name}!`);
    if (user.role === "SELLER") {
      setIsSellerDashboardOpen(true);
    }
  }

  function handleRegisterSuccess(user) {
    setCurrentUser(user);
    setShowAuthModal(false);
    triggerToast(`Account created! Logged in as ${user.name}`);
    if (user.role === "SELLER") {
      setIsSellerDashboardOpen(true);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    triggerToast("Logged out successfully.");
  }

  function handleCompleteOrder(orderRef) {
    setCart({});
    setIsCheckoutOpen(false);
    triggerToast(`Order ${orderRef} confirmed!`);
  }

  const isNotFound = typeof window !== "undefined" && window.location.pathname !== "/" && window.location.pathname !== "/index.html";
  if (isNotFound) {
    return <NotFoundPage />;
  }

  if (isSellerDashboardOpen) {
    return (
      <Suspense fallback={null}>
        <SellerDashboard onClose={() => setIsSellerDashboardOpen(false)} />
        <Toast toast={toast} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-black font-sans antialiased selection:bg-[#A3C1BF] selection:text-black">
      {/* 1. Sticky Navigation Header */}
      <Navbar
        currentUser={currentUser}
        cartCount={cartCount}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(screen) => {
          setAuthInitialScreen(screen);
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        scrolled={scrolled}
        onOpenSellerDashboard={() => setIsSellerDashboardOpen(true)}
      />

      {/* 2. Sticky Category Filter Pills Strip */}
      <CategoryBar
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
      />

      {/* 3. Main Catalog Section */}
      <main className="mx-auto w-full max-w-[1240px] px-4 md:px-8 py-8 min-h-[70vh]">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-2 mb-6">
          <div>
            <h1 className="text-[26px] font-semibold text-black tracking-tight">Stock Your Inventory</h1>
            <p className="text-[13px] text-[#5B5B58] mt-0.5">
              Direct wholesale trade from verified Pakistani manufacturers & suppliers
            </p>
          </div>
          <span className="text-[13px] font-medium text-[#5B5B58] bg-[#EEF3F2] px-3 py-1 rounded-full border border-[#E9E8E2]">
            {filteredProducts.length * 11 + 6} verified suppliers
          </span>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>

        {/* Load More Button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => triggerToast("All available suppliers for this category loaded.")}
            className="inline-flex h-[40px] items-center justify-center rounded-[16px] border border-black bg-transparent px-5 text-[14px] font-medium text-black hover:bg-black/5 transition-colors active:scale-[0.97]"
          >
            Load more ↓
          </button>
        </div>
      </main>

      {/* 4. Footer Section */}
      <footer className="border-t border-[#E9E8E2] bg-[#F9F9F6] pt-10 pb-8 mt-12">
        <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <a href="#" className="flex items-center gap-2 font-semibold text-[18px]">
                <span
                  className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-[12px] font-bold text-black"
                  style={{ background: TOKENS.sage }}
                >
                  LD
                </span>
                LainDain
              </a>
              <p className="text-[13px] text-[#5B5B58] leading-relaxed max-w-[220px]">
                Pakistan's wholesale sourcing platform for verified B2B trade.
              </p>
            </div>

            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5B5B58] mb-3">Categories</h2>
              <div className="flex flex-col gap-2 text-[13px] text-black">
                {CATEGORIES.slice(1, 5).map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className="text-left hover:text-[#85A6A3] transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5B5B58] mb-3">Company</h2>
              <div className="flex flex-col gap-2 text-[13px] text-black">
                <a href="#" className="hover:text-[#85A6A3]">How It Works</a>
                <button onClick={() => { setAuthInitialScreen("register_seller"); setShowAuthModal(true); }} className="text-left hover:text-[#85A6A3]">
                  Sell on LainDain
                </button>
                <a href="#" className="hover:text-[#85A6A3]">About Us</a>
                <a href="#" className="hover:text-[#85A6A3]">Contact</a>
              </div>
            </div>

            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5B5B58] mb-3">Support</h2>
              <div className="flex flex-col gap-2 text-[13px] text-black">
                <a href="#" className="hover:text-[#85A6A3]">Help Centre</a>
                <a href="#" className="hover:text-[#85A6A3]">Buyer Protection</a>
                <a href="#" className="hover:text-[#85A6A3]">Privacy Policy</a>
                <a href="#" className="hover:text-[#85A6A3]">Terms of Trade</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-5 border-t border-[#E9E8E2] text-[11px] text-[#5B5B58] gap-2">
            <span>© 2026 LainDain. All rights reserved.</span>
            <span>Made for Pakistani businesses 🇵🇰</span>
          </div>
        </div>
      </footer>

      {/* 5. Modals & Overlays */}
      <Suspense fallback={null}>
        {/* Mid-screen Product Info Popup */}
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />

        {/* Wholesale Cart Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          cartSubtotal={cartSubtotal}
          onUpdateQty={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onProceedToCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cartSubtotal={cartSubtotal}
          currentUser={currentUser}
          onCompleteOrder={handleCompleteOrder}
        />

        {/* Search Overlay */}
        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          searchQuery={searchQuery}
          onQueryChange={setSearchQuery}
          searchResults={searchResults}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setIsSearchOpen(false);
          }}
          onSelectProduct={(p) => {
            setSelectedProduct(p);
            setIsSearchOpen(false);
          }}
        />

        {/* Auth Modal Container */}
        <AuthModal
          isOpen={showAuthModal}
          initialScreen={authInitialScreen}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={handleRegisterSuccess}
        />

        {/* Laila B2B AI Assistant Widget */}
        <ChatWidget
          onNavigateCategory={(cat) => {
            if (CATEGORIES.includes(cat)) {
              setActiveCategory(cat);
            } else {
              setActiveCategory("All Suppliers");
            }
            window.scrollTo({ top: 300, behavior: "smooth" });
          }}
          onNavigateProduct={(prodId) => {
            const found = PRODUCTS.find((p) => String(p.id) === String(prodId));
            if (found) {
              setSelectedProduct(found);
            }
          }}
        />
      </Suspense>

      {/* Global Toast */}
      <Toast toast={toast} />

      {/* Vercel Web Analytics & Speed Insights */}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
