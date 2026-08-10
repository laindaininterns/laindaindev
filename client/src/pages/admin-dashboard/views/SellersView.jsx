import React, { useState } from "react";

export default function SellersView({ onNavigateApprovals }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const sellersList = [
    { id: 1, name: "Faisalabad Textiles Co.", cat: "Clothing & Apparel", taxId: "NTN-8492041-A", city: "Faisalabad", status: "Verified", orders: 142, joined: "Jan 12, 2025", icon: "🏢" },
    { id: 2, name: "Lahore Ceramics Hub", cat: "Tiles & Construction", taxId: "NTN-3829102-B", city: "Lahore", status: "Verified", orders: 98, joined: "Feb 04, 2025", icon: "🧱" },
    { id: 3, name: "Khyber Leather Crafts", cat: "Footwear & Goods", taxId: "NTN-9182304-C", city: "Peshawar", status: "Verified", orders: 85, joined: "Mar 18, 2025", icon: "👞" },
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
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-[14px] border border-[#E9E8E2]">
          <span className="text-[11px] font-medium text-[#5B5B58] uppercase">Total Registered</span>
          <h4 className="text-[20px] font-semibold text-black mt-1">124</h4>
        </div>
        <div className="bg-white p-4 rounded-[14px] border border-[#E9E8E2]">
          <span className="text-[11px] font-medium text-[#5B5B58] uppercase">Verified Sellers</span>
          <h4 className="text-[20px] font-semibold text-[#85A6A3] mt-1">118</h4>
        </div>
        <div
          onClick={onNavigateApprovals}
          className="bg-white p-4 rounded-[14px] border border-[#E9E8E2] cursor-pointer hover:border-[#C6564D]/50 transition-colors"
        >
          <span className="text-[11px] font-medium text-[#C6564D] uppercase">Pending Approvals</span>
          <h4 className="text-[20px] font-semibold text-[#C6564D] mt-1">3</h4>
        </div>
        <div className="bg-white p-4 rounded-[14px] border border-[#E9E8E2]">
          <span className="text-[11px] font-medium text-[#5B5B58] uppercase">Suspended</span>
          <h4 className="text-[20px] font-semibold text-[#C6564D] mt-1">3</h4>
        </div>
      </div>

      {/* Filter Header */}
      <div className="bg-white p-4 rounded-[16px] border border-[#E9E8E2] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by business name, NTN, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[40px] pl-9 pr-4 rounded-[12px] border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]"
            />
            <span className="absolute left-3 top-2.5 text-[#5B5B58] text-[14px]">🔍</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[40px] px-3 rounded-[12px] border border-[#E9E8E2] text-[13px] bg-white text-black outline-none focus:border-[#85A6A3]"
          >
            <option value="All">All Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Sellers Directory Table */}
      <div className="bg-white rounded-[16px] border border-[#E9E8E2] p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
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
                    <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-lg">
                      {s.icon}
                    </div>
                    <div>
                      <span className="font-medium text-black">{s.name}</span>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-[#5B5B58] text-[13px]">{s.cat}</td>
                <td className="py-4 text-black text-[13px] font-mono">{s.taxId}</td>
                <td className="py-4 text-black text-[13px]">{s.city}</td>
                <td className="py-4 text-center">
                  {s.status === "Verified" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-0.5 rounded-full border border-[#A3C1BF]/30">
                      ✓ Verified
                    </span>
                  )}
                  {s.status === "Pending" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C6564D] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                      Pending
                    </span>
                  )}
                  {s.status === "Suspended" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-300">
                      Suspended
                    </span>
                  )}
                </td>
                <td className="py-4 text-right font-medium">{s.orders}</td>
                <td className="py-4 text-right text-[#5B5B58] text-[13px]">{s.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
