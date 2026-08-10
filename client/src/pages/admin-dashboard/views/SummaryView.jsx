import React from "react";

export default function SummaryView({ onNavigateTab }) {
  const topSellers = [
    { id: 1, name: "Faisalabad Textiles Co.", cat: "Clothing & Apparel", icon: "👕", orders: 142, revenue: "Rs. 720,000", status: "Verified" },
    { id: 2, name: "Lahore Ceramics Hub", cat: "Tiles & Construction", icon: "🧱", orders: 98, revenue: "Rs. 580,000", status: "Verified" },
    { id: 3, name: "Khyber Leather Crafts", cat: "Footwear", icon: "👟", orders: 85, revenue: "Rs. 410,000", status: "Verified" },
    { id: 4, name: "Sindh Green Agro", cat: "Agriculture & Fertilizers", icon: "🌾", orders: 64, revenue: "Rs. 280,000", status: "Pending" },
  ];

  const trendingProducts = [
    { id: 1, name: "100% Combed Cotton Rolls", supplier: "Faisalabad Textiles", moq: "50 rolls", sold: "1.2k sold", price: "Rs. 850/roll", icon: "👕" },
    { id: 2, name: "Glazed Porcelain Floor Tiles", supplier: "Lahore Ceramics Hub", moq: "100 boxes", sold: "890 sold", price: "Rs. 1.2k/box", icon: "🧱" },
    { id: 3, name: "Export Quality Percale Bed Set", supplier: "Multan Bedding Mills", moq: "20 sets", sold: "740 sold", price: "Rs. 2.1k/set", icon: "🛏️" },
    { id: 4, name: "Heavy Duty Canvas Duffle", supplier: "Khyber Leather Crafts", moq: "15 bags", sold: "620 sold", price: "Rs. 3.5k/bag", icon: "🎒" },
  ];

  return (
    <div className="p-8 max-w-[1240px] mx-auto space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[20px] border border-[#E9E8E2] shadow-xs flex flex-col justify-between hover:border-[#85A6A3] transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[12px] font-bold text-[#5B5B58] uppercase tracking-wider">Total Sales (MTD)</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-[#85A6A3]">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-[28px] font-bold text-black tracking-tight">Rs. 2.4M</h3>
            <p className="text-[12px] text-[#85A6A3] font-bold mt-1">↑ 14% vs last month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[20px] border border-[#E9E8E2] shadow-xs flex flex-col justify-between hover:border-[#85A6A3] transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[12px] font-bold text-[#5B5B58] uppercase tracking-wider">Active Sellers</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-[#5B5B58]">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                <path d="M2 7h20" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-[28px] font-bold text-black tracking-tight">124</h3>
            <p className="text-[12px] text-[#5B5B58] font-semibold mt-1">8 verified today</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[20px] border border-[#E9E8E2] shadow-xs flex flex-col justify-between hover:border-[#C6564D] transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[12px] font-bold text-[#5B5B58] uppercase tracking-wider">Pending Approvals</span>
            <div className="w-9 h-9 rounded-[10px] bg-red-50 flex items-center justify-center text-[#C6564D]">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-[28px] font-bold text-[#C6564D] tracking-tight">3</h3>
            <p className="text-[12px] text-[#C6564D] font-bold mt-1">Requires immediate review</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[20px] border border-[#E9E8E2] shadow-xs flex flex-col justify-between hover:border-[#85A6A3] transition-all">
          <div className="flex justify-between items-start">
            <span className="text-[12px] font-bold text-[#5B5B58] uppercase tracking-wider">Active Buyers</span>
            <div className="w-9 h-9 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-[#5B5B58]">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-[28px] font-bold text-black tracking-tight">1,842</h3>
            <p className="text-[12px] text-[#85A6A3] font-bold mt-1">↑ 22% growth rate</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Sellers Table (Left 7 cols) */}
        <section className="lg:col-span-7 bg-white rounded-[20px] border border-[#E9E8E2] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[20px] font-bold text-black tracking-tight">Top Performing Sellers</h2>
              <p className="text-[13px] font-medium text-[#5B5B58] mt-0.5">Highest order volumes this month</p>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab("sellers")}
              className="px-3.5 py-1.5 rounded-full text-xs bg-[#EEF3F2] hover:bg-[#A3C1BF] text-black font-bold border border-[#E9E8E2] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <span>View all sellers</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E8E2] text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider pb-3">
                  <th className="pb-3">Seller Details</th>
                  <th className="pb-3 text-right">Orders</th>
                  <th className="pb-3 text-right">Revenue</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E8E2]">
                {topSellers.map((seller) => (
                  <tr key={seller.id} className="text-[14px]">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-[12px] bg-[#EEF3F2] flex items-center justify-center text-lg shrink-0 border border-[#E9E8E2]">
                          {seller.icon}
                        </div>
                        <div>
                          <div className="font-bold text-black">{seller.name}</div>
                          <div className="text-[12px] font-medium text-[#5B5B58]">{seller.cat}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right font-bold text-black">{seller.orders}</td>
                    <td className="py-4 text-right font-semibold text-[#5B5B58]">{seller.revenue}</td>
                    <td className="py-4 text-right">
                      {seller.status === "Verified" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-1 rounded-full border border-[#A3C1BF]/40">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C6564D] bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Trending Products (Right 5 cols) */}
        <section className="lg:col-span-5 bg-white rounded-[20px] border border-[#E9E8E2] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[20px] font-bold text-black tracking-tight">Trending Products</h2>
              <p className="text-[13px] font-medium text-[#5B5B58] mt-0.5">Most added to wholesale carts</p>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab("products")}
              className="px-3.5 py-1.5 rounded-full text-xs bg-[#EEF3F2] hover:bg-[#A3C1BF] text-black font-bold border border-[#E9E8E2] transition-all cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <span>View products</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="space-y-4">
            {trendingProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-3.5 rounded-[14px] border border-[#E9E8E2] bg-[#F9F9F6]/60 hover:bg-[#EEF3F2]/50 hover:border-[#85A6A3] transition-all cursor-pointer"
              >
                <div className="h-12 w-12 rounded-[12px] bg-white border border-[#E9E8E2] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                  {p.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[14px] font-bold text-black truncate">{p.name}</h4>
                  <p className="text-[12px] font-medium text-[#5B5B58]">
                    {p.supplier} • MOQ: {p.moq}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-bold text-black block">{p.sold}</span>
                  <p className="text-[11px] font-bold text-[#85A6A3]">{p.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
