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
    <div className="p-8 max-w-[1200px] mx-auto space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[16px] border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#5B5B58] uppercase tracking-wider">Total Sales (Mtd)</span>
            <span className="text-[20px]">📈</span>
          </div>
          <div className="mt-4">
            <h3 className="text-[26px] font-semibold text-black">Rs. 2.4M</h3>
            <p className="text-[12px] text-[#85A6A3] font-medium mt-1">↑ 14% vs last month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[16px] border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#5B5B58] uppercase tracking-wider">Active Sellers</span>
            <span className="text-[20px]">🏬</span>
          </div>
          <div className="mt-4">
            <h3 className="text-[26px] font-semibold text-black">124</h3>
            <p className="text-[12px] text-[#5B5B58] mt-1">8 verified today</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[16px] border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#5B5B58] uppercase tracking-wider">Pending Approvals</span>
            <span className="text-[20px]">🛡️</span>
          </div>
          <div className="mt-4">
            <h3 className="text-[26px] font-semibold text-[#C6564D]">3</h3>
            <p className="text-[12px] text-[#C6564D] font-medium mt-1">Requires action</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[16px] border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#5B5B58] uppercase tracking-wider">Active Buyers</span>
            <span className="text-[20px]">👥</span>
          </div>
          <div className="mt-4">
            <h3 className="text-[26px] font-semibold text-black">1,842</h3>
            <p className="text-[12px] text-[#85A6A3] font-medium mt-1">↑ 22% growth rate</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Sellers Table (Left 7 cols) */}
        <section className="lg:col-span-7 bg-white rounded-[16px] border border-[#E9E8E2] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-semibold text-black">Top Performing Sellers</h2>
              <p class="text-[13px] text-[#5B5B58] mt-0.5">Highest order volumes this month</p>
            </div>
            <button
              onClick={() => onNavigateTab("sellers")}
              className="text-xs text-[#85A6A3] hover:underline font-medium"
            >
              View all sellers
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
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
                        <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-lg">
                          {seller.icon}
                        </div>
                        <div>
                          <div className="font-medium text-black">{seller.name}</div>
                          <div className="text-[12px] text-[#5B5B58]">{seller.cat}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right font-medium">{seller.orders}</td>
                    <td className="py-4 text-right text-[#5B5B58]">{seller.revenue}</td>
                    <td className="py-4 text-right">
                      {seller.status === "Verified" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85A6A3] bg-[#EEF3F2] px-2 py-0.5 rounded-full border border-[#A3C1BF]/30">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C6564D] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
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
        <section className="lg:col-span-5 bg-white rounded-[16px] border border-[#E9E8E2] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-semibold text-black">Trending Products</h2>
              <p className="text-[13px] text-[#5B5B58] mt-0.5">Most added to wholesale carts</p>
            </div>
            <button
              onClick={() => onNavigateTab("products")}
              className="text-xs text-[#85A6A3] hover:underline font-medium"
            >
              View products
            </button>
          </div>

          <div className="space-y-4">
            {trendingProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-3 rounded-[12px] border border-[#E9E8E2]/80 bg-[#F9F9F6]/40 hover:translate-y-[-2px] transition-transform"
              >
                <div className="h-12 w-12 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-xl shrink-0">
                  {p.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[14px] font-medium text-black truncate">{p.name}</h4>
                  <p className="text-[12px] text-[#5B5B58]">
                    {p.supplier} • MOQ: {p.moq}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-semibold text-black">{p.sold}</span>
                  <p className="text-[11px] text-[#85A6A3]">{p.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
