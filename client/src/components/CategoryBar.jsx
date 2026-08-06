import React from "react";
import { CATEGORIES, TOKENS } from "../data/marketplaceData";

export default function CategoryBar({ activeCategory, onSelectCategory }) {
  return (
    <nav
      aria-label="Shop by category"
      className="sticky top-[64px] z-[190] bg-[#F9F9F6] border-b border-[#E9E8E2]"
    >
      <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className="flex-shrink-0 h-[38px] px-4 rounded-full text-[13px] font-medium transition-all duration-150 whitespace-nowrap"
                style={{
                  background: active ? TOKENS.sage : "transparent",
                  color: active ? TOKENS.black : TOKENS.textMuted,
                  border: `1px solid ${active ? TOKENS.sage : TOKENS.border}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
