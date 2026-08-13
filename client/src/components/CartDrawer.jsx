import React from "react";
import { CAT_ICONS } from "../data/marketplaceData";

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  cartSubtotal,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] max-h-[88vh] bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.10)] overflow-hidden flex flex-col transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E9E8E2]">
          <h3 className="text-[20px] font-semibold text-black">Wholesale Cart</h3>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] hover:bg-black/5 text-black"
          >
            ✕
          </button>
        </div>

        {/* Cart Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[140px] space-y-3 divide-y divide-[#E9E8E2]">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 text-[#5B5B58]">
              <div className="text-[34px] mb-3">🛒</div>
              <p className="text-[15px] font-medium text-black">Your cart is empty.</p>
              <p className="text-[13px] mt-1">Browse suppliers to get started.</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const icon = CAT_ICONS[item.cat] || "📦";
              return (
                <div key={`${item.id}-${item.selectedColor || "default"}`} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="h-[52px] w-[52px] flex-shrink-0 rounded-[12px] bg-white overflow-hidden p-0.5 border border-[#E9E8E2] flex items-center justify-center select-none">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-[10px]" />
                    ) : (
                      <span className="text-[22px]">{icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-medium text-black line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-[#5B5B58] mt-0.5">
                      Rs. {(item.price * item.qty).toLocaleString()} · {item.cat}
                      {item.selectedColor && ` (${item.selectedColor})`}
                    </p>
                  </div>

                  {/* Qty Stepper */}
                  <div className="flex items-center border border-[#E9E8E2] rounded-[10px] overflow-hidden bg-white">
                    <button
                      onClick={() => onUpdateQty(item, -1)}
                      className="w-[30px] h-[30px] flex items-center justify-center font-bold text-[15px] hover:bg-[#F9F9F6]"
                    >
                      −
                    </button>
                    <span className="w-[34px] h-[30px] flex items-center justify-center text-[13px] font-medium border-x border-[#E9E8E2]">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item, 1)}
                      className="w-[30px] h-[30px] flex items-center justify-center font-bold text-[15px] hover:bg-[#F9F9F6]"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(item)}
                    className="text-[11px] text-[#5B5B58] hover:text-black underline ml-1"
                  >
                    Remove
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-6 border-t border-[#E9E8E2] bg-white">
          <div className="flex items-center justify-between mb-4 text-[15px]">
            <span className="text-[#5B5B58]">Subtotal (excl. tax)</span>
            <span className="text-[20px] font-semibold text-black">
              Rs. {cartSubtotal.toLocaleString()}
            </span>
          </div>

          <button
            disabled={cartItems.length === 0}
            onClick={onProceedToCheckout}
            className={`w-full h-[48px] rounded-[16px] text-[15px] font-medium transition-all ${
              cartItems.length > 0
                ? "bg-[#A3C1BF] text-black hover:bg-[#85A6A3] cursor-pointer active:scale-[0.98]"
                : "bg-[#E9E8E2] text-[#5B5B58] cursor-not-allowed"
            }`}
          >
            Proceed to Checkout →
          </button>
        </div>
      </div>
    </div>
  );
}
