import React, { useState } from "react";

export default function BuyersView() {
  const [search, setSearch] = useState("");
  const [accountType, setAccountType] = useState("All");

  const buyersList = [
    { id: 1, businessName: "Al-Fateh Shopping Galleria", contactPerson: "Asad Noor", city: "Lahore", orders: 48, spent: "Rs. 2,450,000", type: "Corporate Wholesale", status: "Active", icon: "🏬" },
    { id: 2, name: "Imtiaz Super Market Procurement", contactPerson: "Shahid Raza", city: "Karachi", orders: 112, spent: "Rs. 6,800,000", type: "Enterprise Bulk", status: "Active", icon: "🛒" },
    { id: 3, name: "Chase Up Retail Chain", contactPerson: "Farhan Siddiqui", city: "Karachi", orders: 34, spent: "Rs. 1,920,000", type: "Corporate Wholesale", status: "Active", icon: "🛍️" },
    { id: 4, name: "ChenOne Stores Sourcing", contactPerson: "Zubair Khan", city: "Faisalabad", orders: 29, spent: "Rs. 1,450,000", type: "Corporate Wholesale", status: "Active", icon: "👔" },
    { id: 5, name: "Pakland Construction Pvt Ltd", contactPerson: "Kamran Malik", city: "Islamabad", orders: 18, spent: "Rs. 3,100,000", type: "Contractor Account", status: "Active", icon: "🏗️" },
    { id: 6, name: "Khyber General Traders", contactPerson: "Bilal Ahmad", city: "Peshawar", orders: 12, spent: "Rs. 540,000", type: "Small Business", status: "Active", icon: "📦" },
  ];

  const filteredBuyers = buyersList.filter((b) => {
    const name = b.businessName || b.name;
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || b.contactPerson.toLowerCase().includes(search.toLowerCase()) || b.city.toLowerCase().includes(search.toLowerCase());
    const matchesType = accountType === "All" || b.type === accountType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8 max-w-[1240px] mx-auto space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Total Registered Buyers</span>
          <h4 className="text-[26px] font-bold text-black tracking-tight mt-1">1,842</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Active Corporate Accounts</span>
          <h4 className="text-[26px] font-bold text-[#85A6A3] tracking-tight mt-1">1,210</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Wholesale Orders</span>
          <h4 className="text-[26px] font-bold text-black tracking-tight mt-1">4,890</h4>
        </div>
        <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs hover:border-[#85A6A3] transition-all">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider">Total Spend (MTD)</span>
          <h4 className="text-[26px] font-bold text-black tracking-tight mt-1">Rs. 18.5M</h4>
        </div>
      </div>

      {/* Filter Header */}
      <div className="bg-white p-5 rounded-[20px] border border-[#E9E8E2] shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by buyer company, contact person, city..."
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
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="h-[42px] px-4 rounded-[12px] border border-[#E9E8E2] text-[13px] font-bold bg-white text-black outline-none focus:border-[#85A6A3] cursor-pointer shadow-2xs"
          >
            <option value="All">All Account Types</option>
            <option value="Corporate Wholesale">Corporate Wholesale</option>
            <option value="Enterprise Bulk">Enterprise Bulk</option>
            <option value="Contractor Account">Contractor Account</option>
            <option value="Small Business">Small Business</option>
          </select>
        </div>
      </div>

      {/* Buyers Directory Table */}
      <div className="bg-white rounded-[20px] border border-[#E9E8E2] p-6 shadow-xs overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E9E8E2] text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider pb-3">
              <th className="pb-3">Buyer Company</th>
              <th className="pb-3">Contact Person</th>
              <th className="pb-3">City</th>
              <th className="pb-3 text-right">Orders Placed</th>
              <th className="pb-3 text-right">Total Spent</th>
              <th className="pb-3">Account Type</th>
              <th className="pb-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9E8E2]">
            {filteredBuyers.map((b) => {
              const name = b.businessName || b.name;
              return (
                <tr key={b.id} className="text-[14px] hover:bg-[#F9F9F6]/60 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[12px] bg-[#EEF3F2] border border-[#E9E8E2] flex items-center justify-center text-lg shrink-0">
                        {b.icon}
                      </div>
                      <span className="font-bold text-black">{name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-[#5B5B58] text-[13px] font-semibold">{b.contactPerson}</td>
                  <td className="py-4 text-black text-[13px] font-bold">{b.city}</td>
                  <td className="py-4 text-right font-bold text-black">{b.orders}</td>
                  <td className="py-4 text-right text-black font-bold">{b.spent}</td>
                  <td className="py-4 text-[#5B5B58] text-[13px] font-semibold">{b.type}</td>
                  <td className="py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-1 rounded-full border border-[#A3C1BF]/40">
                      ✓ Active
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
