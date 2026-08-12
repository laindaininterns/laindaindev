import React, { useState, useMemo } from "react";

export default function InventoryTab({
  products = [],
  setProducts,
  handleAdjustStock,
  handleToggleOutOfStock,
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
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-semibold text-black tracking-tight">Inventory Management</h1>
        <p className="text-[13px] text-[#5B5B58] mt-0.5">
          Dedicated datasheet view of product stock levels, visibility overrides, and catalog health.
        </p>
      </div>

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
            className={`pb-3 text-[14px] font-semibold relative transition-all ${
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
                            className="h-8 w-8 bg-[#EEF3F2] hover:bg-[#E9E8E2] text-black font-semibold text-[13px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -10
                          </button>
                          <button
                            disabled={product.isOutOfStock}
                            onClick={() => handleAdjustStock(product.id, 10)}
                            className="h-8 w-8 bg-[#EEF3F2] hover:bg-[#E9E8E2] text-black font-semibold text-[13px] border-l border-[#E9E8E2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    No products matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
