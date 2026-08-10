import React, { useState } from "react";

export default function ProductsView() {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  const productsList = [
    { id: 1, name: "100% Combed Cotton Fabric Rolls", cat: "Clothing & Apparel", supplier: "Faisalabad Textiles Co.", moq: 50, price: 850, stock: 450, status: "Active", icon: "👕" },
    { id: 2, name: "Glazed Porcelain Floor Tiles 60x60", cat: "Tiles & Construction", supplier: "Lahore Ceramics Hub", moq: 100, price: 1200, stock: 120, status: "Active", icon: "🧱" },
    { id: 3, name: "Cold-Rolled Steel Coils 2mm", cat: "Steel & Metals", supplier: "Karachi Steel Traders", moq: 10, price: 45000, stock: 15, status: "Active", icon: "⚙️" },
    { id: 4, name: "Full Grain Buffalo Leather Sheets", cat: "Footwear & Leather", supplier: "Gujranwala Leather Co.", moq: 20, price: 3200, stock: 85, status: "Active", icon: "👞" },
    { id: 5, name: "Heavy-Duty Leather Duffle Bags", cat: "Bags & Luggage", supplier: "Sialkot Leather Goods", moq: 15, price: 4100, stock: 0, status: "Out of Stock", icon: "🎒" },
    { id: 6, name: "Organic NPK Fertilizer 50kg Bags", cat: "Agriculture & Chemicals", supplier: "Punjab Agrochem Pvt", moq: 40, price: 2100, stock: 320, status: "Active", icon: "🌾" },
    { id: 7, name: "Industrial Weatherproof Exterior Paint", cat: "Paints & Coatings", supplier: "Multan Paint Works", moq: 25, price: 5400, stock: 60, status: "Active", icon: "🎨" },
    { id: 8, name: "Handloom Lawn Unstitched Suit Sets", cat: "Clothing & Apparel", supplier: "Hyderabad Textile Mills", moq: 30, price: 1800, stock: 210, status: "Active", icon: "👗" },
  ];

  const filteredProducts = productsList.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.supplier.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === "All" || p.cat === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-8 max-w-[1240px] mx-auto space-y-6">
      {/* Stat Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Total Listings</span>
          <h4 className="text-[26px] font-bold text-black tracking-tight mt-1">1,248</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Active Suppliers</span>
          <h4 className="text-[26px] font-bold text-black tracking-tight mt-1">124</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#C6564D] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Out of Stock</span>
          <h4 className="text-[26px] font-bold text-[#C6564D] tracking-tight mt-1">12</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#C6564D] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Flagged Listings</span>
          <h4 className="text-[26px] font-bold text-[#C6564D] tracking-tight mt-1">2</h4>
        </div>
      </div>

      {/* Filter Header */}
      <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products or suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[42px] pl-10 pr-4 rounded-[12px] border border-[#E9E8E2] text-[14px] font-medium outline-none focus:border-[#85A6A3] bg-[#F9F9F6]/50"
            />
            <span className="absolute left-3.5 top-3 text-[#5B5B58]">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="h-[42px] px-4 rounded-[12px] border border-[#E9E8E2] text-[13px] font-bold bg-white text-black outline-none focus:border-[#85A6A3] cursor-pointer shadow-2xs"
          >
            <option value="All">All Categories</option>
            <option value="Clothing & Apparel">Clothing & Apparel</option>
            <option value="Tiles & Construction">Tiles & Construction</option>
            <option value="Steel & Metals">Steel & Metals</option>
            <option value="Footwear & Leather">Footwear & Leather</option>
            <option value="Bags & Luggage">Bags & Luggage</option>
            <option value="Agriculture & Chemicals">Agriculture & Chemicals</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-[20px] border border-[#E9E8E2] p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E9E8E2] text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider pb-3">
              <th className="pb-3">Product Name</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Supplier</th>
              <th className="pb-3 text-right">MOQ</th>
              <th className="pb-3 text-right">Unit Price</th>
              <th className="pb-3 text-right">Stock</th>
              <th className="pb-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E8E2]">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="text-[14px] hover:bg-[#F9F9F6]/60 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[12px] bg-[#EEF3F2] border border-[#E9E8E2] flex items-center justify-center text-lg shrink-0">
                      {p.icon}
                    </div>
                    <span className="font-bold text-black">{p.name}</span>
                  </div>
                </td>
                <td className="py-4 text-[#5B5B58] text-[13px] font-semibold">{p.cat}</td>
                <td className="py-4 text-black text-[13px] font-bold">{p.supplier}</td>
                <td className="py-4 text-right font-bold text-black">{p.moq}</td>
                <td className="py-4 text-right text-black font-bold">Rs. {p.price.toLocaleString()}</td>
                <td className="py-4 text-right font-bold text-black">{p.stock}</td>
                <td className="py-4 text-center">
                  {p.stock > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-1 rounded-full border border-[#A3C1BF]/40">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C6564D] bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                      Out of Stock
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
