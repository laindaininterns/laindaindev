import React from "react";
import { TOKENS } from "../data/marketplaceData";

export default function ProductCard({ product, onSelectProduct }) {
  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-[20px] overflow-hidden flex flex-col transition-all duration-200 border border-[#E9E8E2] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Compact Product Visual Box */}
      <div className="relative h-[230px] p-3 select-none overflow-hidden bg-white">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover rounded-[16px] transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      {/* Card Details Content */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="text-[14px] font-semibold text-black leading-snug line-clamp-1 group-hover:text-[#5B5B58] transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-1">
            {/* Category Tag */}
            <span className="text-[10px] font-medium text-[#5B5B58] bg-[#F9F9F6] px-2 py-0.5 rounded-full border border-[#E9E8E2]">
              {product.cat}
            </span>
            {/* Rating */}
            <span className="text-[11px] font-semibold text-[#85A6A3]">
              {product.rating}
            </span>
          </div>
        </div>

        {/* Single Primary Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectProduct(product);
          }}
          className="mt-auto w-full h-[36px] rounded-[14px] text-[13px] font-medium text-black transition-all active:scale-[0.97] flex items-center justify-center"
          style={{ background: TOKENS.sage }}
          onMouseEnter={(e) => (e.currentTarget.style.background = TOKENS.sageDark)}
          onMouseLeave={(e) => (e.currentTarget.style.background = TOKENS.sage)}
        >
          View details
        </button>
      </div>
    </div>
  );
}
