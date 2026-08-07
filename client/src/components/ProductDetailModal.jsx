import React, { useState, useEffect } from "react";
import { CAT_ICONS, COLOR_OPTIONS, TOKENS } from "../data/marketplaceData";

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  if (!product) return null;

  const [quantity, setQuantity] = useState(product.moq || 10);
  const colorList = COLOR_OPTIONS[product.cat] || [];
  const [selectedColor, setSelectedColor] = useState(colorList[0]?.name || "");

  useEffect(() => {
    setQuantity(product.moq || 10);
    setSelectedColor(colorList[0]?.name || "");
  }, [product]);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.desc,
    "category": product.cat,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "PKR",
      "availability": "https://schema.org/InStock"
    }
  };

  const icon = CAT_ICONS[product.cat] || "📦";

  function handleDecrease() {
    setQuantity((prev) => Math.max(product.moq || 1, prev - 5));
  }

  function handleIncrease() {
    setQuantity((prev) => prev + 5);
  }

  function handleAdd() {
    onAddToCart({
      ...product,
      selectedColor: selectedColor || null,
      qty: quantity,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[440] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div
        className="w-full max-w-[520px] max-h-[90vh] bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col transition-all duration-200 border border-[#E9E8E2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#E9E8E2] bg-[#F9F9F6]">
          <div>
            <h3 className="text-[18px] font-semibold text-black leading-snug">{product.name}</h3>
            <span className="text-[12px] text-[#5B5B58] mt-0.5 block">{product.cat}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close product details"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] hover:bg-black/5 text-black font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Big Product Image Box */}
          <div className={`h-[180px] rounded-[18px] bg-gradient-to-br ${product.imageBg} flex items-center justify-center text-[64px] border border-[#E9E8E2] shadow-inner select-none relative`}>
            <span>{icon}</span>
            <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[12px] font-medium text-white">
              MOQ: {product.moq} units
            </div>
          </div>

          {/* Description */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B5B58]">Product Overview</span>
            <p className="text-[14px] text-black leading-relaxed mt-1">{product.desc}</p>
          </div>

          {/* Color Selection (if available) */}
          {colorList.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B5B58]">
                Select Color Option: <span className="text-black font-medium">{selectedColor}</span>
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {colorList.map((col) => {
                  const isSelected = selectedColor === col.name;
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => setSelectedColor(col.name)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                        isSelected
                          ? "border-black bg-black text-white shadow-xs"
                          : "border-[#E9E8E2] bg-[#F9F9F6] text-black hover:border-[#85A6A3]"
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-black/20"
                        style={{ background: col.hex }}
                      />
                      {col.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wholesale Pricing Specs */}
          <div className="divide-y divide-[#E9E8E2] text-[14px]">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#5B5B58]">Unit Wholesale Price</span>
              <span className="font-semibold text-black">Rs. {product.price.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#5B5B58]">Minimum Order Quantity (MOQ)</span>
              <span className="font-semibold text-black">{product.moq} units</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#5B5B58]">Supplier Rating</span>
              <span className="font-semibold text-[#85A6A3]">{product.rating}</span>
            </div>
          </div>

          {/* Quantity Setup Stepper */}
          <div className="rounded-[16px] bg-[#EEF3F2] p-4 border border-[#E9E8E2] flex items-center justify-between">
            <div>
              <span className="block text-[12px] font-medium text-[#5B5B58]">Order Quantity</span>
              <span className="block text-[11px] text-[#5B5B58]">(Min: {product.moq} units)</span>
            </div>
            <div className="flex items-center border border-[#E9E8E2] bg-white rounded-[12px] overflow-hidden">
              <button
                type="button"
                onClick={handleDecrease}
                className="w-10 h-10 flex items-center justify-center font-bold text-[16px] hover:bg-black/5"
              >
                −
              </button>
              <span className="w-12 h-10 flex items-center justify-center font-semibold text-[14px] border-x border-[#E9E8E2]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                className="w-10 h-10 flex items-center justify-center font-bold text-[16px] hover:bg-black/5"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer Action - Proceed to Cart Button */}
        <div className="p-5 border-t border-[#E9E8E2] bg-white">
          <div className="flex items-center justify-between mb-3 text-[14px]">
            <span className="text-[#5B5B58]">Total Amount</span>
            <span className="text-[20px] font-semibold text-black">
              Rs. {(product.price * quantity).toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleAdd}
            className="w-full h-[48px] rounded-[16px] text-[15px] font-medium text-black transition-all active:scale-[0.98] flex items-center justify-center"
            style={{ background: TOKENS.sage }}
            onMouseEnter={(e) => (e.currentTarget.style.background = TOKENS.sageDark)}
            onMouseLeave={(e) => (e.currentTarget.style.background = TOKENS.sage)}
          >
            Proceed to Cart ({quantity} units) →
          </button>
        </div>
      </div>
    </div>
  );
}
