import React from "react";
import { TOKENS } from "../data/marketplaceData";

export default function Navbar({
  currentUser,
  cartCount,
  onOpenSearch,
  onOpenCart,
  onOpenAuth,
  onLogout,
  scrolled,
}) {
  return (
    <header
      className="sticky top-0 z-[200] h-[64px] flex items-center transition-all duration-200 border-b border-[#E9E8E2]"
      style={{
        background: scrolled ? "rgba(249,249,246,0.92)" : TOKENS.offWhite,
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
      }}
    >
      <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 font-semibold text-[18px] tracking-tight">
          <span
            className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[8px] text-[12px] font-bold text-black"
            style={{ background: TOKENS.sage }}
          >
            LD
          </span>
          <span className="text-black font-semibold">LainDain</span>
        </a>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            aria-label="Search suppliers or products"
            className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-transparent hover:bg-black/5 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="#000" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* User Auth Buttons / Profile status */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EEF3F2] text-[13px] font-medium text-black border border-[#E9E8E2]">
                👤 {currentUser.name}
              </span>
              <button
                onClick={onLogout}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-[#C6564D] hover:bg-red-50 transition-colors"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth("register_seller")}
                className="hidden sm:inline-flex h-[40px] items-center justify-center rounded-[16px] px-4 text-[14px] font-medium text-black transition-all active:scale-[0.97]"
                style={{ background: TOKENS.sage }}
                onMouseEnter={(e) => (e.currentTarget.style.background = TOKENS.sageDark)}
                onMouseLeave={(e) => (e.currentTarget.style.background = TOKENS.sage)}
              >
                Register as Seller
              </button>
              <button
                onClick={() => onOpenAuth("login")}
                className="h-[40px] px-3.5 rounded-[16px] text-[14px] font-medium text-[#5B5B58] hover:text-black transition-colors"
              >
                Sign in
              </button>
            </div>
          )}

          {/* Wholesale Cart Trigger */}
          <button
            onClick={onOpenCart}
            aria-label="Wholesale cart"
            className="relative flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-transparent hover:bg-black/5 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 7H6" />
              <circle cx="9.5" cy="20.5" r="1.2" />
              <circle cx="17.5" cy="20.5" r="1.2" />
            </svg>
            <span
              className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none"
              style={{ background: TOKENS.black }}
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
