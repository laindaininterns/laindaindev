import React, { useState } from "react";

export default function SellersView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const sellersList = [
    { id: 1, name: "Faisalabad Textiles Co.", cat: "Clothing & Apparel", initial: "FT", city: "Faisalabad", ntn: "NTN-3829102-F", orders: 142, revenue: "Rs. 720,000", status: "Verified" },
    { id: 2, name: "Lahore Ceramics Hub", cat: "Tiles & Construction", initial: "LC", city: "Lahore", ntn: "NTN-9102834-L", orders: 98, revenue: "Rs. 580,000", status: "Verified" },
    { id: 3, name: "Khyber Leather Crafts", cat: "Footwear & Goods", initial: "KL", city: "Peshawar", ntn: "NTN-1928374-P", orders: 85, revenue: "Rs. 410,000", status: "Verified" },
    { id: 4, name: "Sindh Green Agro", cat: "Agriculture & Fertilizers", initial: "SG", city: "Sukkur", ntn: "NTN-2938102-D", orders: 64, revenue: "Rs. 280,000", status: "Pending" },
    { id: 5, name: "Multan Bedding Mills", cat: "Home Textiles", initial: "MC", city: "Multan", ntn: "NTN-5591028-M", orders: 52, revenue: "Rs. 320,000", status: "Verified" },
    { id: 6, name: "Rawalpindi Hardware", cat: "Tools & Hardware", initial: "RA", city: "Rawalpindi", ntn: "NTN-7719283-R", orders: 41, revenue: "Rs. 195,000", status: "Verified" },
  ];

  const filteredSellers = sellersList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()) || s.ntn.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-[1240px] mx-auto space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[12px] font-medium text-[#5B5B58] uppercase tracking-wider">Total Registered Sellers</span>
          <h4 className="text-[26px] font-semibold text-black tracking-tight mt-1">124</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[12px] font-medium text-[#5B5B58] uppercase tracking-wider">Verified Business Accounts</span>
          <h4 className="text-[26px] font-semibold text-[#85A6A3] tracking-tight mt-1">118</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#C6564D] transition-all">
          <span className="text-[12px] font-medium text-[#5B5B58] uppercase tracking-wider">Pending Verification</span>
          <h4 className="text-[26px] font-semibold text-[#C6564D] tracking-tight mt-1">3</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[12px] font-medium text-[#5B5B58] uppercase tracking-wider">Total Fulfillment Revenue</span>
          <h4 className="text-[26px] font-semibold text-black tracking-tight mt-1">Rs. 2.5M</h4>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-[20px] border border-[#E9E8E2] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search seller by business name, city, NTN..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[40px] px-3.5 rounded-[12px] border border-[#E9E8E2] text-[13px] font-medium bg-white text-black outline-none focus:border-[#85A6A3] cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Verified">Verified Only</option>
            <option value="Pending">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Sellers Directory Table */}
      <div className="bg-white rounded-[20px] border border-[#E9E8E2] p-6 shadow-2xs overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
              <th className="pb-3">Seller / Business</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">City</th>
              <th className="pb-3">Tax Registration (NTN)</th>
              <th className="pb-3 text-right">Orders Fulfilled</th>
              <th className="pb-3 text-right">Total Revenue</th>
              <th className="pb-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E8E2]">
            {filteredSellers.map((seller) => (
              <tr key={seller.id} className="text-[14px] hover:bg-[#F9F9F6]/50 transition-colors">
                <td className="py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-[10px] bg-[#EEF3F2] border border-[#E9E8E2] flex items-center justify-center font-semibold text-black text-xs shrink-0">
                      {seller.initial}
                    </div>
                    <span className="font-semibold text-black text-[14px]">{seller.name}</span>
                  </div>
                </td>
                <td className="py-3.5 text-[#5B5B58] text-[13px] font-normal">{seller.cat}</td>
                <td className="py-3.5 text-black text-[13px] font-medium">{seller.city}</td>
                <td className="py-3.5 text-[#5B5B58] text-[12px] font-mono">{seller.ntn}</td>
                <td className="py-3.5 text-right font-semibold text-black text-[13px]">{seller.orders}</td>
                <td className="py-3.5 text-right font-medium text-[#5B5B58] text-[13px]">{seller.revenue}</td>
                <td className="py-3.5 text-center">
                  {seller.status === "Verified" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-0.5 rounded-full border border-[#A3C1BF]/30">
                      ✓ Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C6564D] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                      Pending
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
