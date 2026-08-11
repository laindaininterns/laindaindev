import React from 'react';

export default function AdminSummaryPage({ pendingCount, onSelectTab }) {
  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#5B5B58] uppercase tracking-wider">Total Sales (Mtd)</span>
            <span className="text-[20px]">📈</span>
          </div>
          <div className="mt-4">
            <h3 className="text-[26px] font-semibold text-black">Rs. 2.4M</h3>
            <p className="text-[12px] text-[#85A6A3] font-medium mt-1">↑ 14% vs last month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#5B5B58] uppercase tracking-wider">Active Sellers</span>
            <span className="text-[20px]">🏬</span>
          </div>
          <div className="mt-4">
            <h3 className="text-[26px] font-semibold text-black">124</h3>
            <p className="text-[12px] text-[#5B5B58] mt-1">8 verified today</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#5B5B58] uppercase tracking-wider">Pending Approvals</span>
            <span className="text-[20px]">🛡️</span>
          </div>
          <div className="mt-4">
            <h3 className="text-[26px] font-semibold text-[#C6564D]">{pendingCount}</h3>
            <p className="text-[12px] text-[#C6564D] font-medium mt-1">Requires action</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
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

      {/* Split Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Sellers Table */}
        <section className="lg:col-span-7 bg-white rounded-lg border border-[#E9E8E2] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-semibold text-black">Top Performing Sellers</h2>
              <p className="text-[13px] text-[#5B5B58] mt-0.5">Highest order volumes this month</p>
            </div>
            <button onClick={() => onSelectTab('sellers')} className="text-xs text-[#85A6A3] hover:underline font-medium">
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
                <tr className="text-[14px]">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-lg">👕</div>
                      <div>
                        <div className="font-medium text-black">Faisalabad Textiles Co.</div>
                        <div className="text-[12px] text-[#5B5B58]">Clothing & Apparel</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right font-medium">142</td>
                  <td className="py-4 text-right text-[#5B5B58]">Rs. 720,000</td>
                  <td className="py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85A6A3] bg-[#EEF3F2] px-2 py-0.5 rounded-full border border-[#A3C1BF]/30">
                      ✓ Verified
                    </span>
                  </td>
                </tr>

                <tr className="text-[14px]">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-lg">🧱</div>
                      <div>
                        <div className="font-medium text-black">Lahore Ceramics Hub</div>
                        <div className="text-[12px] text-[#5B5B58]">Tiles & Construction</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right font-medium">98</td>
                  <td className="py-4 text-right text-[#5B5B58]">Rs. 580,000</td>
                  <td className="py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85A6A3] bg-[#EEF3F2] px-2 py-0.5 rounded-full border border-[#A3C1BF]/30">
                      ✓ Verified
                    </span>
                  </td>
                </tr>

                <tr className="text-[14px]">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-lg">👟</div>
                      <div>
                        <div className="font-medium text-black">Khyber Leather Crafts</div>
                        <div className="text-[12px] text-[#5B5B58]">Footwear</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right font-medium">85</td>
                  <td className="py-4 text-right text-[#5B5B58]">Rs. 410,000</td>
                  <td className="py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#85A6A3] bg-[#EEF3F2] px-2 py-0.5 rounded-full border border-[#A3C1BF]/30">
                      ✓ Verified
                    </span>
                  </td>
                </tr>

                <tr className="text-[14px]">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-lg">🌾</div>
                      <div>
                        <div className="font-medium text-black">Sindh Green Agro</div>
                        <div className="text-[12px] text-[#5B5B58]">Agriculture & Fertilizers</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right font-medium">64</td>
                  <td className="py-4 text-right text-[#5B5B58]">Rs. 280,000</td>
                  <td className="py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C6564D] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      Pending
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Trending Products */}
        <section className="lg:col-span-5 bg-white rounded-lg border border-[#E9E8E2] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-semibold text-black">Trending Products</h2>
              <p className="text-[13px] text-[#5B5B58] mt-0.5">Most added to wholesale carts</p>
            </div>
            <button onClick={() => onSelectTab('products')} className="text-xs text-[#85A6A3] hover:underline font-medium">
              View products
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg border border-[#E9E8E2]/60 hover:translate-y-[-2px] transition-all bg-[#F9F9F6]/40">
              <div className="h-12 w-12 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-xl shrink-0">👕</div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[14px] font-medium text-black truncate">100% Combed Cotton Rolls</h4>
                <p className="text-[12px] text-[#5B5B58]">Faisalabad Textiles • MOQ: 50 rolls</p>
              </div>
              <div className="text-right">
                <span className="text-[14px] font-semibold text-black">1.2k sold</span>
                <p className="text-[11px] text-[#85A6A3]">Rs. 850/roll</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg border border-[#E9E8E2]/60 hover:translate-y-[-2px] transition-all bg-[#F9F9F6]/40">
              <div className="h-12 w-12 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-xl shrink-0">🧱</div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[14px] font-medium text-black truncate">Glazed Porcelain Floor Tiles</h4>
                <p className="text-[12px] text-[#5B5B58]">Lahore Ceramics Hub • MOQ: 100 boxes</p>
              </div>
              <div className="text-right">
                <span className="text-[14px] font-semibold text-black">890 sold</span>
                <p className="text-[11px] text-[#85A6A3]">Rs. 1.2k/box</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg border border-[#E9E8E2]/60 hover:translate-y-[-2px] transition-all bg-[#F9F9F6]/40">
              <div className="h-12 w-12 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-xl shrink-0">🛏️</div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[14px] font-medium text-black truncate">Export Quality Percale Bed Set</h4>
                <p className="text-[12px] text-[#5B5B58]">Multan Bedding Mills • MOQ: 20 sets</p>
              </div>
              <div className="text-right">
                <span className="text-[14px] font-semibold text-black">740 sold</span>
                <p className="text-[11px] text-[#85A6A3]">Rs. 2.1k/set</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg border border-[#E9E8E2]/60 hover:translate-y-[-2px] transition-all bg-[#F9F9F6]/40">
              <div className="h-12 w-12 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-xl shrink-0">🎒</div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[14px] font-medium text-black truncate">Heavy Duty Canvas Duffle</h4>
                <p className="text-[12px] text-[#5B5B58]">Khyber Leather Crafts • MOQ: 15 bags</p>
              </div>
              <div className="text-right">
                <span className="text-[14px] font-semibold text-black">620 sold</span>
                <p className="text-[11px] text-[#85A6A3]">Rs. 3.5k/bag</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
