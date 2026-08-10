import React, { useState, useEffect, lazy, Suspense } from "react";
import { PRODUCTS, CATEGORIES, TOKENS } from "./data/marketplaceData";
import Navbar from "./components/Navbar";
import CategoryBar from "./components/CategoryBar";
import ProductCard from "./components/ProductCard";
import Toast from "./components/Toast";
import NotFoundPage from "./components/NotFoundPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminSummaryPage from "./components/admin/AdminSummaryPage";
import AdminApprovalsPage from "./components/admin/AdminApprovalsPage";
import AdminSellersPage from "./components/admin/AdminSellersPage";
import AdminBuyersPage from "./components/admin/AdminBuyersPage";
import AdminProductsPage from "./components/admin/AdminProductsPage";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const ProductDetailModal = lazy(() => import("./components/ProductDetailModal"));
const CartDrawer = lazy(() => import("./components/CartDrawer"));
const CheckoutModal = lazy(() => import("./components/CheckoutModal"));
const SearchOverlay = lazy(() => import("./components/SearchOverlay"));
const AuthModal = lazy(() => import("./components/auth/AuthModal"));
const ChatWidget = lazy(() => import("./components/chatbot/ChatWidget"));

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState("marketplace"); // 'marketplace' or 'admin'
  const [adminTab, setAdminTab] = useState("summary");
  const [pendingCount, setPendingCount] = useState(3);

  // App state
  const [activeCategory, setActiveCategory] = useState("All Suppliers");
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(true); // Pops up initially
  const [authInitialScreen, setAuthInitialScreen] = useState("login");

  // Modals & Overlays state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Cart State (map by product id + color)
  const [cart, setCart] = useState({});

  // Toast Notification state
  const [toast, setToast] = useState({ show: false, message: "", tone: "success" });

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
    if (isAdminRoute) {
      if (savedToken && parsedUser?.role === "ADMIN") {
        setCurrentView("admin");
        setShowAuthModal(false);
        const targetTab = pathname.split("/admin/")[1];
        if (targetTab && ["summary", "approvals", "sellers", "buyers", "products"].includes(targetTab)) {
          setAdminTab(targetTab);
        }
      } else {
        // Block unauthorized access to /admin
        setCurrentView("marketplace");
        setShowAuthModal(true);
        setAuthInitialScreen("login");
        triggerToast("Access denied. Admin authentication required.", "error");
      }
    } else if (savedToken && parsedUser?.role === "ADMIN") {
      setShowAuthModal(false);
    } else if (savedToken && parsedUser) {
      setShowAuthModal(false);
    }
  }, []);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (currentView === "admin") {
      document.title = "LainDain Admin Dashboard | Management";
    } else if (selectedProduct) {
      document.title = `${selectedProduct.name} | LainDain Wholesale`;
    } else if (activeCategory && activeCategory !== "All Suppliers") {
      document.title = `${activeCategory} Suppliers | LainDain (Land10)`;
    } else {
      document.title = "LainDain (Land10) — B2B Wholesale Marketplace";
    }
  }, [currentView, selectedProduct, activeCategory]);

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

  // Compute Filtered Products
  const filteredProducts =
    activeCategory === "All Suppliers"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.cat === activeCategory);

  // Compute Search Results
  const searchResults = searchQuery.trim()
    ? PRODUCTS.filter(
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

  // Auth Handlers with Role-Based Redirect & Persistence
  function handleLoginSuccess(user) {
    setCurrentUser(user);
    setShowAuthModal(false);
    localStorage.setItem("user_session", JSON.stringify(user));
    if (user.role === "ADMIN") {
      setCurrentView("admin");
      setAdminTab("summary");
      triggerToast(`Welcome Admin, ${user.name}! Redirected to Admin Dashboard.`);
    } else {
      setCurrentView("marketplace");
      triggerToast(`Welcome back, ${user.name}!`);
    }
  }

  function handleRegisterSuccess(user) {
    setCurrentUser(user);
    setShowAuthModal(false);
    localStorage.setItem("user_session", JSON.stringify(user));
    if (user.role === "ADMIN") {
      setCurrentView("admin");
      setAdminTab("summary");
      triggerToast(`Admin account created! Logged in as ${user.name}`);
    } else {
      setCurrentView("marketplace");
      triggerToast(`Account created! Logged in as ${user.name}`);
    }
  }

  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_session");
    setCurrentUser(null);
    setCurrentView("marketplace");
    setShowAuthModal(true);
    setAuthInitialScreen("login");
    triggerToast("Logged out successfully.");
  }

  function handleCompleteOrder(orderRef) {
    setCart({});
    setIsCheckoutOpen(false);
    triggerToast(`Order ${orderRef} confirmed!`);
  }

  const isNotFound = typeof window !== "undefined" && window.location.pathname !== "/" && window.location.pathname !== "/index.html" && !window.location.pathname.startsWith("/admin");
  if (isNotFound) {
    return <NotFoundPage />;
  }

  // Render Admin View if user is ADMIN or Admin view active
  if (currentView === "admin") {
    return (
      <div className="relative">
        {/* Top switch bar */}
        <div className="bg-black text-white px-4 py-1.5 text-xs flex justify-between items-center z-[100] relative">
          <span>🛡️ Admin Portal Active — Authenticated as {currentUser?.name || "Admin"}</span>
          <button
            onClick={() => setCurrentView("marketplace")}
            className="text-[#A3C1BF] hover:underline font-medium"
          >
            ← Browse Wholesale Marketplace
          </button>
        </div>

        <AdminLayout
          activeTab={adminTab}
          onSelectTab={setAdminTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          pendingCount={pendingCount}
        >
          {adminTab === "summary" && (
            <AdminSummaryPage pendingCount={pendingCount} onSelectTab={setAdminTab} />
          )}
          {adminTab === "approvals" && (
            <AdminApprovalsPage
              onRefreshCount={setPendingCount}
              triggerToast={triggerToast}
            />
          )}
          {adminTab === "sellers" && (
            <AdminSellersPage onSelectTab={setAdminTab} />
          )}
          {adminTab === "buyers" && <AdminBuyersPage />}
          {adminTab === "products" && <AdminProductsPage />}
        </AdminLayout>

        <Toast toast={toast} />
      </div>
    );
  }

  // Render Marketplace View
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
      />

      {/* Admin Quick Switch Pill if Admin user browsing marketplace */}
      {currentUser?.role === "ADMIN" && (
        <div className="bg-[#EEF3F2] border-b border-[#A3C1BF]/40 py-2 px-4 text-center text-xs font-medium text-black">
          🛡️ Admin session active.{" "}
          <button
            onClick={() => setCurrentView("admin")}
            className="text-[#85A6A3] font-semibold underline ml-1"
          >
            Open Admin Dashboard →
          </button>
        </div>
      )}

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
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />

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

        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cartSubtotal={cartSubtotal}
          currentUser={currentUser}
          onCompleteOrder={handleCompleteOrder}
        />

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

        <AuthModal
          isOpen={showAuthModal}
          initialScreen={authInitialScreen}
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
          onRegisterSuccess={handleRegisterSuccess}
        />

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

      <Analytics />
      <SpeedInsights />
    </div>
  );
}
