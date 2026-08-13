import React, { useState, useEffect } from "react";
import { fetchSellerProducts, updateSellerStockRequest } from "../../services/api";

export default function ProductsTab({
  products: initialProducts,
  setProducts,
  handleAdjustStock,
  handleToggleOutOfStock,
  onOpenAddModal,
  onOpenEditModal,
  triggerToast
}) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSellerProducts();
  }, []);

  async function loadSellerProducts() {
    setLoading(true);
    try {
      const data = await fetchSellerProducts();
      if (data && data.length > 0) {
        // Map backend schema (title, stock_quantity, price) to component schema
        const mapped = data.map((p) => ({
          id: p.id,
          name: p.title || p.name,
          sku: p.id.substring(0, 8).toUpperCase(),
          cat: p.category_id || "Wholesale Catalog",
          price: p.price,
          stock: p.stock_quantity,
          isOutOfStock: p.status === "OUT_OF_STOCK" || p.stock_quantity === 0,
          moq: p.moq || 10,
          photos: p.images || [],
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.warn("Using initial products state:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onAdjustStock(product, delta) {
    try {
      if (typeof product.id === "string" && product.id.length > 10) {
        await updateSellerStockRequest(product.id, { delta });
      }
      handleAdjustStock(product.id, delta);
      if (triggerToast) triggerToast(`Stock updated for ${product.name}`);
    } catch (err) {
      handleAdjustStock(product.id, delta);
    }
  }

  async function onToggleStock(product) {
    try {
      const nextOutOfStock = !product.isOutOfStock;
      if (typeof product.id === "string" && product.id.length > 10) {
        await updateSellerStockRequest(product.id, { isOutOfStock: nextOutOfStock });
      }
      handleToggleOutOfStock(product.id);
      if (triggerToast) triggerToast(`Stock state updated for ${product.name}`);
    } catch (err) {
      handleToggleOutOfStock(product.id);
    }
  }

  const filteredProducts = initialProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cat.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-black">Inventory Catalog Management</h2>
          <p className="text-xs text-[#5B5B58] mt-0.5">Manage your wholesale products, update stock levels, and control visibility</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[38px] px-3 text-xs rounded-lg border border-[#E9E8E2] outline-none bg-white w-[200px]"
          />
          <button
            onClick={onOpenAddModal}
            className="h-[38px] px-4 bg-[#A3C1BF] hover:bg-[#85A6A3] text-black font-bold text-xs rounded-lg transition-colors shrink-0"
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="bg-white border border-[#E9E8E2] rounded-lg p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs font-medium text-[#5B5B58]">Loading seller inventory...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-xs font-medium text-[#5B5B58] bg-[#F9F9F6] rounded-lg border border-[#E9E8E2]">
            No inventory items matching search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
                  <th className="pb-3">Product Info</th>
                  <th className="pb-3">SKU & Category</th>
                  <th className="pb-3 text-right">Wholesale Price</th>
                  <th className="pb-3 text-right">MOQ</th>
                  <th className="pb-3 text-center">Stock Quantity</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Inventory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E8E2]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="text-xs hover:bg-[#F9F9F6]/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#EEF3F2] flex items-center justify-center text-base shrink-0 overflow-hidden">
                          {p.photos && p.photos.length > 0 && typeof p.photos[0] === 'string' && p.photos[0].startsWith('http') ? (
                            <img src={p.photos[0]} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            '📦'
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-black">{p.name}</div>
                          <div className="text-[10px] text-[#5B5B58]">{p.photos ? `${p.photos.length} photos uploaded` : 'No photos'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="font-medium text-black">{p.sku || 'TX-880'}</div>
                      <div className="text-[10px] text-[#5B5B58]">{p.cat}</div>
                    </td>

                    <td className="py-4 text-right font-bold text-black">Rs. {p.price.toLocaleString()}</td>
                    <td className="py-4 text-right text-[#5B5B58]">{p.moq || 10} units</td>

                    <td className="py-4 text-center">
                      <div className="inline-flex items-center gap-2 bg-[#F9F9F6] px-2 py-1 rounded-lg border border-[#E9E8E2]">
                        <button
                          onClick={() => onAdjustStock(p, -10)}
                          className="h-5 w-5 rounded bg-white hover:bg-gray-100 text-black font-bold text-xs flex items-center justify-center shadow-xs"
                        >
                          -
                        </button>
                        <span className="font-bold text-black min-w-[30px] text-center">{p.stock}</span>
                        <button
                          onClick={() => onAdjustStock(p, 10)}
                          className="h-5 w-5 rounded bg-white hover:bg-gray-100 text-black font-bold text-xs flex items-center justify-center shadow-xs"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td className="py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          !p.isOutOfStock && p.stock > 0
                            ? "bg-[#EEF3F2] text-[#85A6A3] border-[#A3C1BF]/30"
                            : "bg-red-50 text-[#C6564D] border-red-200"
                        }`}
                      >
                        {!p.isOutOfStock && p.stock > 0 ? "✓ In Stock" : "✕ Out of Stock"}
                      </span>
                    </td>

                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onToggleStock(p)}
                          className="px-2.5 py-1 text-[11px] font-medium border border-[#E9E8E2] rounded bg-white hover:bg-[#F9F9F6] transition-colors"
                        >
                          {p.isOutOfStock ? "Set In-Stock" : "Set Out-of-Stock"}
                        </button>
                        <button
                          onClick={() => onOpenEditModal(p)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-[#A3C1BF] hover:bg-[#85A6A3] text-black rounded transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
