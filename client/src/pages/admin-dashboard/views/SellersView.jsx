import React, { useState } from "react";

export default function SellersView({ onNavigateApprovals }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const sellersList = [
    { id: 1, name: "Faisalabad Textiles Co.", cat: "Clothing & Apparel", taxId: "NTN-8492041-A", city: "Faisalabad", status: "Verified", orders: 142, joined: "Jan 12, 2025", icon: "👕" },
    { id: 2, name: "Lahore Ceramics Hub", cat: "Tiles & Construction", taxId: "NTN-3829102-B", city: "Lahore", status: "Verified", orders: 98, joined: "Feb 04, 2025", icon: "🧱" },
    { id: 3, name: "Khyber Leather Crafts", cat: "Footwear & Goods", taxId: "NTN-9182304-C", city: "Peshawar", status: "Verified", orders: 85, joined: "Mar 18, 2025", icon: "👟" },
    { id: 4, name: "Sindh Green Agro", cat: "Agriculture & Fert.", taxId: "NTN-2938102-D", city: "Sukkur", status: "Pending", orders: 0, joined: "Aug 02, 2025", icon: "🌾" },
    { id: 5, name: "Multan Bedding Mills", cat: "Home Textiles", taxId: "NTN-4829102-E", city: "Multan", status: "Verified", orders: 64, joined: "Apr 11, 2025", icon: "🛏️" },
    { id: 6, name: "Quetta Hardware Supply", cat: "Tools & Metals", taxId: "NTN-1029384-F", city: "Quetta", status: "Suspended", orders: 12, joined: "May 20, 2025", icon: "🔧" },
  ];

  const filteredSellers = sellersList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()) || s.taxId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-[1240px] mx-auto space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Total Registered</span>
          <h4 className="text-[26px] font-bold text-black tracking-tight mt-1">124</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Verified Sellers</span>
          <h4 className="text-[26px] font-bold text-[#85A6A3] tracking-tight mt-1">118</h4>
        </div>
        <div
          onClick={onNavigateApprovals}
          className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] cursor-pointer hover:border-[#C6564D] hover:bg-red-50/20 transition-all shadow-2xs"
        >
          <span className="text-[11px] font-bold text-[#C6564D] uppercase tracking-wider">Pending Approvals</span>
          <h4 className="text-[26px] font-bold text-[#C6564D] tracking-tight mt-1">3</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#C6564D] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Suspended</span>
          <h4 className="text-[26px] font-bold text-[#C6564D] tracking-tight mt-1">3</h4>
        </div>
      </div>

      {/* Filter Header */}
      <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by business name, NTN, city..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[42px] px-4 rounded-[12px] border border-[#E9E8E2] text-[13px] font-bold bg-white text-black outline-none focus:border-[#85A6A3] cursor-pointer shadow-2xs"
          >
            <option value="All">All Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Sellers Directory Table */}
      <div className="bg-white rounded-[20px] border border-[#E9E8E2] p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E9E8E2] text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider pb-3">
              <th className="pb-3">Business Name</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Tax ID (NTN)</th>
              <th className="pb-3">City</th>
              <th className="pb-3 text-center">Status</th>
              <th className="pb-3 text-right">Completed Orders</th>
              <th className="pb-3 text-right">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E8E2]">
            {filteredSellers.map((s) => (
              <tr key={s.id} className="text-[14px] hover:bg-[#F9F9F6]/60 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[12px] bg-[#EEF3F2] border border-[#E9E8E2] flex items-center justify-center text-lg shrink-0">
                      {s.icon}
                    </div>
                    <div>
                      <span className="font-bold text-black">{s.name}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-[#5B5B58] text-[13px] font-semibold">{s.cat}</td>
                <td className="py-4 text-black text-[13px] font-mono font-semibold">{s.taxId}</td>
                <td className="py-4 text-black text-[13px] font-bold">{s.city}</td>
                <td className="py-4 text-center">
                  {s.status === "Verified" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-1 rounded-full border border-[#A3C1BF]/40">
                      ✓ Verified
                    </span>
                  )}
                  {s.status === "Pending" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C6564D] bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                      Pending
                    </span>
                  )}
                  {s.status === "Suspended" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-300">
                      Suspended
                    </span>
                  )}
                </td>
                <td className="py-4 text-right font-bold text-black">{s.orders}</td>
                <td className="py-4 text-right text-[#5B5B58] text-[13px] font-semibold">{s.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
