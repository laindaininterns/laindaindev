import React, { useState } from "react";

export default function ProductsView() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const productsList = [
    { id: 1, name: "100% Combed Cotton Rolls", cat: "Clothing & Apparel", initial: "CC", seller: "Faisalabad Textiles Co.", price: "Rs. 850 / roll", stock: "1,450 rolls", status: "Active" },
    { id: 2, name: "Glazed Porcelain Floor Tiles", cat: "Tiles & Construction", initial: "GT", seller: "Lahore Ceramics Hub", price: "Rs. 1,200 / box", stock: "820 boxes", status: "Active" },
    { id: 3, name: "Agri-Grade Urea Fertilizer (50kg)", cat: "Agriculture", initial: "AG", seller: "Sindh Green Agro", price: "Rs. 3,400 / bag", stock: "0 bags", status: "Out of Stock" },
    { id: 4, name: "Export Quality Percale Bed Set", cat: "Home Textiles", initial: "PB", seller: "Multan Bedding Mills", price: "Rs. 2,100 / set", stock: "450 sets", status: "Active" },
    { id: 5, name: "Industrial Steel Fasteners Set", cat: "Hardware", initial: "HW", seller: "Rawalpindi Hardware", price: "Rs. 450 / pack", stock: "3,200 packs", status: "Active" },
    { id: 6, name: "Premium Calfskin Leather Sheet", cat: "Leather Goods", initial: "CE", seller: "Khyber Leather Crafts", price: "Rs. 4,800 / sheet", stock: "120 sheets", status: "Active" },
    { id: 7, name: "Handcrafted Chiniot Wooden Chair", cat: "Furniture", initial: "LF", seller: "Chiniot Wood Arts", price: "Rs. 8,500 / unit", stock: "40 units", status: "Active" },
    { id: 8, name: "Organic Basmati Rice (50kg Bulk)", cat: "Agriculture", initial: "AF", seller: "Punjab Rice Exporters", price: "Rs. 9,200 / bag", stock: "600 bags", status: "Flagged" },
  ];

  const filtered = productsList.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.seller.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || p.cat === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-8 max-w-[1240px] mx-auto space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[12px] font-medium text-[#5B5B58] uppercase tracking-wider">Total Catalog Items</span>
          <h4 className="text-[26px] font-semibold text-black tracking-tight mt-1">4,890</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[12px] font-medium text-[#5B5B58] uppercase tracking-wider">Active Wholesale Listings</span>
          <h4 className="text-[26px] font-semibold text-[#85A6A3] tracking-tight mt-1">4,756</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[12px] font-medium text-[#5B5B58] uppercase tracking-wider">Out of Stock</span>
          <h4 className="text-[26px] font-semibold text-black tracking-tight mt-1">12</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#C6564D] transition-all">
          <span className="text-[12px] font-medium text-[#5B5B58] uppercase tracking-wider">Flagged Listings</span>
          <h4 className="text-[26px] font-semibold text-[#C6564D] tracking-tight mt-1">2</h4>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[20px] border border-[#E9E8E2] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search product title, seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[40px] pl-10 pr-4 rounded-[12px] border border-[#E9E8E2] text-[13px] font-normal outline-none focus:border-[#85A6A3] bg-[#F9F9F6]/50"
            />
            <span className="absolute left-3.5 top-3 text-[#5B5B58]">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-[40px] px-3.5 rounded-[12px] border border-[#E9E8E2] text-[13px] font-medium bg-white text-black outline-none focus:border-[#85A6A3] cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Clothing & Apparel">Clothing & Apparel</option>
            <option value="Tiles & Construction">Tiles & Construction</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Home Textiles">Home Textiles</option>
            <option value="Hardware">Hardware</option>
            <option value="Leather Goods">Leather Goods</option>
            <option value="Furniture">Furniture</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-[20px] border border-[#E9E8E2] p-6 shadow-2xs overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
              <th className="pb-3">Product Name</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Supplier / Seller</th>
              <th className="pb-3 text-right">Wholesale Price</th>
              <th className="pb-3 text-right">Available Stock</th>
              <th className="pb-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E8E2]">
            {filtered.map((p) => (
              <tr key={p.id} className="text-[14px] hover:bg-[#F9F9F6]/50 transition-colors">
                <td className="py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-[10px] bg-[#EEF3F2] border border-[#E9E8E2] flex items-center justify-center font-semibold text-black text-xs shrink-0">
                      {p.initial}
                    </div>
                    <span className="font-semibold text-black text-[14px]">{p.name}</span>
                  </div>
                </td>
                <td className="py-3.5 text-[#5B5B58] text-[13px] font-normal">{p.cat}</td>
                <td className="py-3.5 text-black text-[13px] font-medium">{p.seller}</td>
                <td className="py-3.5 text-right font-semibold text-black text-[13px]">{p.price}</td>
                <td className="py-3.5 text-right font-normal text-[#5B5B58] text-[13px]">{p.stock}</td>
                <td className="py-3.5 text-center">
                  {p.status === "Active" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-0.5 rounded-full border border-[#A3C1BF]/30">
                      ✓ Active
                    </span>
                  )}
                  {p.status === "Out of Stock" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5B5B58] bg-[#F9F9F6] px-2.5 py-0.5 rounded-full border border-[#E9E8E2]">
                      Out of Stock
                    </span>
                  )}
                  {p.status === "Flagged" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C6564D] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                      Flagged
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
