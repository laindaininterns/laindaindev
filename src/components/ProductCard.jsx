import React from "react";
import { CAT_ICONS, TOKENS } from "../data/marketplaceData";

export default function ProductCard({ product, onSelectProduct }) {
  const icon = CAT_ICONS[product.cat] || "📦";

  return (
    <div
      className="group bg-white rounded-[24px] overflow-hidden flex flex-col transition-all duration-200 border border-[#E9E8E2] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] hover:-translate-y-1"
    >
      {/* Product Image / Visual Box */}
      <div className={`relative aspect-square bg-gradient-to-br ${product.imageBg} flex items-center justify-center p-6 select-none`}>
        <div className="text-[56px] transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-black shadow-xs">
          Rs. {product.price.toLocaleString()} / unit
        </div>
      </div>

      {/* Product Details Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-medium text-black leading-snug line-clamp-1">{product.name}</h3>
        </div>

        {/* Verified Badge */}
        {product.verified ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85A6A3]">
            <svg viewBox="0 0 24 24" className="h-[11px] w-[11px]" fill="none" stroke="#85A6A3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 13 9 18 20 6" />
            </svg>
            Verified
          </span>
        ) : (
          <span className="text-[11px] font-medium text-[#5B5B58]">Unverified Supplier</span>
        )}

        {/* Category Tag */}
        <span className="self-start text-[11px] font-medium text-[#5B5B58] bg-[#F9F9F6] px-2.5 py-0.5 rounded-full border border-[#E9E8E2] mb-1">
          {product.cat}
        </span>

        {/* Price & MOQ Summary */}
        <div className="text-[12px] text-[#5B5B58] flex justify-between items-center mb-1">
          <span>MOQ: {product.moq} units</span>
          <span className="font-semibold text-black">{product.rating}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-[#E9E8E2]">
          <button
            onClick={() => onSelectProduct(product)}
            className="w-full h-[40px] rounded-[16px] text-[14px] font-medium text-black transition-all active:scale-[0.97]"
            style={{ background: TOKENS.sage }}
            onMouseEnter={(e) => (e.currentTarget.style.background = TOKENS.sageDark)}
            onMouseLeave={(e) => (e.currentTarget.style.background = TOKENS.sage)}
          >
            Proceed to Cart
          </button>
          <button
            onClick={() => onSelectProduct(product)}
            className="w-full h-[40px] rounded-[16px] border border-black bg-transparent text-[14px] font-medium text-black hover:bg-black/5 transition-colors active:scale-[0.97]"
          >
            View details
          </button>
        </div>
      </div>
    </div>
  );
}
