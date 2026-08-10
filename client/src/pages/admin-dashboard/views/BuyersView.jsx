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
    <div className="p-8 max-w-[1200px] mx-auto space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-[14px] border border-[#E9E8E2]">
          <span className="text-[11px] font-medium text-[#5B5B58] uppercase">Total Registered Buyers</span>
          <h4 className="text-[20px] font-semibold text-black mt-1">1,842</h4>
        </div>
        <div className="bg-white p-4 rounded-[14px] border border-[#E9E8E2]">
          <span className="text-[11px] font-medium text-[#5B5B58] uppercase">Active Corporate Accounts</span>
          <h4 className="text-[20px] font-semibold text-[#85A6A3] mt-1">1,210</h4>
        </div>
        <div className="bg-white p-4 rounded-[14px] border border-[#E9E8E2]">
          <span className="text-[11px] font-medium text-[#5B5B58] uppercase">Wholesale Orders</span>
          <h4 className="text-[20px] font-semibold text-black mt-1">4,890</h4>
        </div>
        <div className="bg-white p-4 rounded-[14px] border border-[#E9E8E2]">
          <span className="text-[11px] font-medium text-[#5B5B58] uppercase">Total Spend (Mtd)</span>
          <h4 className="text-[20px] font-semibold text-black mt-1">Rs. 18.5M</h4>
        </div>
      </div>

      {/* Filter Header */}
      <div className="bg-white p-4 rounded-[16px] border border-[#E9E8E2] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by buyer company, contact person, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[40px] pl-9 pr-4 rounded-[12px] border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]"
            />
            <span className="absolute left-3 top-2.5 text-[#5B5B58] text-[14px]">🔍</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="h-[40px] px-3 rounded-[12px] border border-[#E9E8E2] text-[13px] bg-white text-black outline-none focus:border-[#85A6A3]"
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
      <div className="bg-white rounded-[16px] border border-[#E9E8E2] p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
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
                      <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-lg">
                        {b.icon}
                      </div>
                      <span className="font-medium text-black">{name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-[#5B5B58] text-[13px]">{b.contactPerson}</td>
                  <td className="py-4 text-black text-[13px]">{b.city}</td>
                  <td className="py-4 text-right font-medium">{b.orders}</td>
                  <td className="py-4 text-right text-black font-semibold">{b.spent}</td>
                  <td className="py-4 text-[#5B5B58] text-[13px]">{b.type}</td>
                  <td className="py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-0.5 rounded-full border border-[#A3C1BF]/30">
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
