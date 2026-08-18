import React, { useRef, useEffect, useState } from "react";
import { CATEGORIES, CAT_ICONS, CAT_IMAGES } from "../data/marketplaceData";
import { fetchMarketplaceProductsRequest } from "../services/api";
import posthog, { isPostHogEnabled } from "../posthog";

export default function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  onQueryChange,
  searchResults = [],
  onSelectCategory,
  onSelectProduct,
}) {
  const inputRef = useRef(null);
  const [liveDbResults, setLiveDbResults] = useState([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);

      function handleKeyDown(e) {
        if (e.key === "Escape") {
          onClose();
        }
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Debounced Live Backend Database Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || !isOpen) {
      setLiveDbResults([]);
      setIsSearchingDb(false);
      return;
    }

    setIsSearchingDb(true);
    const handler = setTimeout(async () => {
      try {
        const live = await fetchMarketplaceProductsRequest({ search: trimmed });
        if (Array.isArray(live)) {
          setLiveDbResults(live);
        }
      } catch (err) {
        console.warn("Live search error:", err.message);
      } finally {
        setIsSearchingDb(false);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  // Merge local search results with live database results by unique ID
  const mergedMap = new Map();
  for (const item of searchResults) {
    if (item && item.id) mergedMap.set(String(item.id), item);
  }
  for (const item of liveDbResults) {
    if (item && item.id) mergedMap.set(String(item.id), item);
  }
  const combinedResults = Array.from(mergedMap.values());

  const popularCats = CATEGORIES.slice(1, 7);

  return (
    <div
      className="fixed inset-0 z-[450] p-4 bg-black/40 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="relative top-[8vh] mx-auto w-full max-w-[580px] bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-5 border border-[#E9E8E2] transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 h-[48px] px-3.5 border border-[#E9E8E2] rounded-[16px] bg-[#F9F9F6] focus-within:border-[#85A6A3] transition-colors">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#5B5B58]" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search products, suppliers, or categories (e.g. keyboard, cotton)..."
            aria-label="Search suppliers or products"
            className="flex-1 min-w-0 bg-transparent text-[15px] outline-none placeholder:text-[#5B5B58] text-black"
          />
          {searchQuery && (
            <button
              onClick={() => onQueryChange("")}
              aria-label="Clear query"
              className="text-[#5B5B58] hover:text-black text-[12px] px-1.5 py-1 rounded hover:bg-black/5"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close search"
            className="flex h-8 w-8 items-center justify-center rounded-[10px] hover:bg-black/5 text-black"
          >
            ✕
          </button>
        </div>

        {/* Live Search Results */}
        {searchQuery.trim().length > 0 ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-[13px] font-semibold text-[#5B5B58] mb-2 px-1">
              <span>
                {combinedResults.length > 0
                  ? `${combinedResults.length} matching wholesale product${combinedResults.length === 1 ? "" : "s"}`
                  : (isSearchingDb ? "Searching catalog..." : "No products match that search")}
              </span>
              {isSearchingDb && <span className="text-[11px] text-[#85A6A3]">Searching database...</span>}
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1">
              {combinedResults.map((p) => {
                const icon = CAT_ICONS[p.cat] || "📦";
                const displayImage = p.image || p.photos?.[0] || p.images?.[0] || CAT_IMAGES[p.cat] || CAT_IMAGES["Clothing & Apparel"];

                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (isPostHogEnabled) {
                        posthog.capture("search_result_selected", {
                          product_id: p.id,
                          category: p.cat,
                          result_count: combinedResults.length,
                        });
                      }
                      onSelectProduct(p);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-[14px] hover:bg-[#EEF3F2]/60 text-left transition-all border border-transparent hover:border-[#E9E8E2] group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-[46px] w-[46px] flex-shrink-0 rounded-[12px] bg-white overflow-hidden p-0.5 border border-[#E9E8E2] flex items-center justify-center select-none shadow-sm">
                        {displayImage ? (
                          <img src={displayImage} alt={p.name || p.title} className="w-full h-full object-cover rounded-[10px]" />
                        ) : (
                          <span className="text-[20px]">{icon}</span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <span className="block text-[14px] font-semibold text-black truncate group-hover:text-[#1B3E3B]">
                          {p.name || p.title}
                        </span>
                        <div className="flex items-center gap-2 text-[12px] text-[#5B5B58] truncate mt-0.5">
                          <span className="font-medium text-[#1B3E3B] bg-[#EEF3F2] px-2 py-0.5 rounded-full text-[11px]">
                            {p.cat || p.category || "Wholesale"}
                          </span>
                          {p.supplier && (
                            <span className="truncate text-[11px] text-[#5B5B58]">
                              by {p.supplier}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="block text-[14px] font-bold text-black">
                        Rs. {parseFloat(p.price || 0).toLocaleString()}
                      </span>
                      <span className="block text-[11px] text-[#85A6A3] font-medium">
                        MOQ: {p.moq || 10} units
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Popular Categories */
          <div className="mt-4">
            <div className="text-[13px] font-semibold text-[#5B5B58] mb-2.5 px-1">Popular categories</div>
            <div className="flex flex-wrap gap-2">
              {popularCats.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onSelectCategory(cat);
                    onClose();
                  }}
                  className="h-[36px] px-3.5 border border-[#E9E8E2] bg-[#F9F9F6] rounded-full text-[13px] font-medium text-black hover:border-[#85A6A3] hover:bg-white transition-colors cursor-pointer"
                >
                  {CAT_ICONS[cat] || "📦"} {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
