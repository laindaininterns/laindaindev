import React, { useRef, useEffect } from "react";
import { CATEGORIES, CAT_ICONS } from "../data/marketplaceData";

export default function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  onQueryChange,
  searchResults,
  onSelectCategory,
  onSelectProduct,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const popularCats = CATEGORIES.slice(1, 7);

  return (
    <div
      className="fixed inset-0 z-[450] p-4 bg-black/40 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="relative top-[8vh] mx-auto w-full max-w-[560px] bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.10)] p-5 border border-[#E9E8E2] transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 h-[48px] px-3.5 border border-[#E9E8E2] rounded-[16px]">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#5B5B58]" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search suppliers or products..."
            aria-label="Search suppliers or products"
            className="flex-1 min-w-0 bg-transparent text-[15px] outline-none placeholder:text-[#5B5B58]"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] hover:bg-[#F9F9F6] text-black"
          >
            ✕
          </button>
        </div>

        {/* Live Search Results */}
        {searchQuery.trim().length > 0 ? (
          <div className="mt-4">
            <div className="text-[14px] font-semibold text-black mb-2">
              {searchResults.length > 0
                ? `${searchResults.length} matching supplier${searchResults.length === 1 ? "" : "s"}`
                : "No suppliers match that search"}
            </div>
            <div className="max-h-[44vh] overflow-y-auto space-y-1">
              {searchResults.map((p) => {
                const icon = CAT_ICONS[p.cat] || "📦";
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-[12px] hover:bg-[#F9F9F6] text-left transition-colors"
                  >
                    <span className="h-[40px] w-[40px] flex-shrink-0 rounded-[10px] bg-white overflow-hidden p-0.5 border border-[#E9E8E2] flex items-center justify-center select-none">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-[8px]" />
                      ) : (
                        <span className="text-[18px]">{icon}</span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium text-black truncate">{p.name}</span>
                      <span className="block text-[11px] text-[#5B5B58] truncate">{p.cat} · Rs. {p.price.toLocaleString()}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Popular Categories */
          <div className="mt-4">
            <div className="text-[14px] font-semibold text-black mb-2.5">Popular categories</div>
            <div className="flex flex-wrap gap-2">
              {popularCats.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onSelectCategory(cat);
                    onClose();
                  }}
                  className="h-[36px] px-3.5 border border-[#E9E8E2] rounded-full text-[13px] font-medium text-black hover:border-[#85A6A3] transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
