import React, { useState, useMemo } from "react";

export default function InventoryTab({
  products = [],
  setProducts,
  handleAdjustStock,
  handleToggleOutOfStock,
  onSaveInventory,
  isSavingInventory,
  onOpenAddModal,
}) {
  const [activeSubTab, setActiveSubTab] = useState("all"); // "all", "low", "out"

  // Filter products based on sub-tab
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isOut = p.stock === 0 || p.isOutOfStock;
      const isLow = p.stock < 10 && !isOut;
      if (activeSubTab === "low") return isLow;
      if (activeSubTab === "out") return isOut;
      return true;
    });
  }, [products, activeSubTab]);

  return (
    <div className="space-y-6">
      {/* Header & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-black tracking-tight">Inventory Management</h1>
          <p className="text-[13px] text-[#5B5B58] mt-0.5">
            Dedicated datasheet view of product stock levels, visibility overrides, and catalog health.
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={onSaveInventory}
            disabled={isSavingInventory}
            className="h-[42px] px-5 rounded-[12px] bg-[#A3C1BF] text-black text-[13px] font-bold hover:bg-[#85A6A3] transition-all active:scale-[0.97] flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSavingInventory ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Saving to Database...
              </>
            ) : (
              <>
                <span>💾</span> Save Inventory Changes
              </>
            )}
          </button>
        )}
      </div>

      {/* When 0 products */}
      {products.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#E9E8E2] p-10 text-center flex flex-col items-center justify-center min-h-[360px] shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#EEF3F2] flex items-center justify-center text-[28px] mb-4 text-[#85A6A3]">
            📊
          </div>
          <h3 className="text-[18px] font-semibold text-black">No inventory records found</h3>
          <p className="text-[13px] text-[#5B5B58] max-w-[380px] mt-1 mb-6 leading-relaxed">
            You don't have any products in your inventory datasheet yet. Add your products to start tracking and modifying stock levels in real time.
          </p>
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="h-[44px] px-6 rounded-[14px] bg-[#A3C1BF] text-black font-semibold text-[13px] hover:bg-[#85A6A3] transition-all active:scale-[0.97] cursor-pointer shadow-xs"
            >
              + Add Product to Inventory
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Internal Tabs */}
          <div className="flex border-b border-[#E9E8E2] gap-6">
            {[
              { id: "all", label: "All Items" },
              { id: "low", label: "Low Stock (<10)" },
              { id: "out", label: "Out of Stock" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`pb-3 text-[14px] font-semibold relative transition-all cursor-pointer ${
                  activeSubTab === tab.id
                    ? "text-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#85A6A3]"
                    : "text-[#5B5B58] hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Inventory Table Datasheet */}
          <div className="bg-white rounded-[24px] border border-[#E9E8E2] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#F9F9F6] border-b border-[#E9E8E2]">
                    <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Product Details</th>
                    <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">SKU</th>
                    <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Category</th>
                    <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Wholesale Price</th>
                    <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58] text-center">Stock Level</th>
                    <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58] text-center">Status</th>
                    <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58] text-right">Stock Adjustments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E8E2]">
                  {filteredProducts.map((product) => {
                    const isOut = product.stock === 0 || product.isOutOfStock;
                    const isLow = product.stock < 10 && !isOut;

                    return (
                      <tr key={product.id} className="hover:bg-[#EEF3F2]/20 transition-colors">
                        {/* Details Column */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[8px] bg-[#EEF3F2] overflow-hidden flex-shrink-0 flex items-center justify-center border border-[#E9E8E2]">
                              {product.photos && product.photos.length > 0 ? (
                                <img src={product.photos[0]} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] font-bold text-neutral-400">LD</span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[14px] text-black line-clamp-1">{product.name}</p>
                              <p className="text-[11px] text-[#5B5B58]">Min. MOQ: {product.moq} pcs</p>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="p-4 text-[13px] text-[#5B5B58] font-mono">{product.sku}</td>

                        {/* Category */}
                        <td className="p-4 text-[13px] text-black">{product.cat}</td>

                        {/* Price */}
                        <td className="p-4 text-[13px] font-semibold text-black">Rs. {product.price.toLocaleString()}</td>

                        {/* Stock Input */}
                        <td className="p-4 text-center">
                          <input
                            type="number"
                            disabled={product.isOutOfStock}
                            value={product.isOutOfStock ? 0 : product.stock}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              const finalVal = isNaN(val) ? 0 : Math.max(0, val);
                              setProducts((prev) =>
                                prev.map((p) => (p.id === product.id ? { ...p, stock: finalVal } : p))
                              );
                            }}
                            className="w-20 h-8 text-center text-[13px] font-semibold border border-[#E9E8E2] rounded-[8px] bg-white focus:outline-none focus:ring-1 focus:ring-[#85A6A3] disabled:bg-neutral-100 disabled:text-neutral-400"
                          />
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isOut
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : isLow
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isOut ? "Out of Stock" : isLow ? "Low Stock" : "Healthy"}
                          </span>
                        </td>

                        {/* Quick Adjust Buttons */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <label className="relative inline-flex items-center cursor-pointer mr-2">
                              <input
                                type="checkbox"
                                checked={!product.isOutOfStock}
                                onChange={() => handleToggleOutOfStock(product.id)}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-[#E9E8E2] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#A3C1BF]"></div>
                            </label>

                            <div className="inline-flex rounded-lg overflow-hidden border border-[#E9E8E2]">
                              <button
                                disabled={product.isOutOfStock}
                                onClick={() => handleAdjustStock(product.id, -10)}
                                className="h-8 w-8 bg-[#EEF3F2] hover:bg-[#E9E8E2] text-black font-semibold text-[13px] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                -10
                              </button>
                              <button
                                disabled={product.isOutOfStock}
                                onClick={() => handleAdjustStock(product.id, 10)}
                                className="h-8 w-8 bg-[#EEF3F2] hover:bg-[#E9E8E2] text-black font-semibold text-[13px] border-l border-[#E9E8E2] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                +10
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-[#5B5B58] text-sm">
                        No products matching the active filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
