import React, { useState } from 'react';
import { PRODUCTS } from '../../data/marketplaceData';

export default function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filtered = PRODUCTS.filter((p) => {
    const matchesCat = categoryFilter === 'All' || p.cat === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.desc.toLowerCase().includes(search.toLowerCase()) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-black">Wholesale Products Catalog</h2>
          <p className="text-[13px] text-[#5B5B58]">Manage and review live product listings across categories</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search products or suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[38px] px-3 text-[13px] rounded-md border border-[#E9E8E2] outline-none bg-white w-[220px]"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-[38px] px-3 text-[13px] rounded-md border border-[#E9E8E2] outline-none bg-white"
          >
            <option value="All">All Categories</option>
            <option value="Apparel & Textiles">Apparel & Textiles</option>
            <option value="Industrial Machinery">Industrial Machinery</option>
            <option value="Electronics & Components">Electronics & Components</option>
            <option value="Home & Office Furniture">Home & Office Furniture</option>
            <option value="Chemicals & Raw Materials">Chemicals & Raw Materials</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E9E8E2] p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
                <th className="pb-3">Product Name</th>
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Wholesale Price</th>
                <th className="pb-3 text-right">MOQ</th>
                <th className="pb-3 text-right">Stock Qty</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E8E2]">
              {filtered.map((p) => (
                <tr key={p.id} className="text-[14px] hover:bg-[#F9F9F6]/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-lg shrink-0">
                        📦
                      </div>
                      <div>
                        <div className="font-medium text-black">{p.name}</div>
                        <div className="text-[12px] text-[#5B5B58]">{p.supplierName || 'Verified Supplier'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-[#5B5B58]">{p.cat}</td>
                  <td className="py-4 text-right font-medium">Rs. {p.price.toLocaleString()}</td>
                  <td className="py-4 text-right text-[#5B5B58]">{p.moq || 10} units</td>
                  <td className="py-4 text-right font-medium text-black">{(p.id * 140 + 250).toLocaleString()}</td>
                  <td className="py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-0.5 rounded-full border border-[#A3C1BF]/30">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
