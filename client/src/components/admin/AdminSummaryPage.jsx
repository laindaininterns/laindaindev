import React, { useState, useEffect } from 'react';
import { fetchAdminSummary } from '../../services/api';

export default function AdminSummaryPage({ pendingCount, onSelectTab }) {
  const [metrics, setMetrics] = useState({
    total_sales: 0,
    active_sellers: 0,
    pending_approvals: pendingCount || 0,
    active_buyers: 0,
  });
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaryData();
  }, []);

  async function loadSummaryData(forceRefresh = false) {
    try {
      const summaryData = await fetchAdminSummary(forceRefresh);
      if (summaryData) {
        if (summaryData.metrics) setMetrics(summaryData.metrics);
        if (summaryData.trending_products) setTrendingProducts(summaryData.trending_products);
        if (summaryData.top_sellers) setTopSellers(summaryData.top_sellers);
      }
    } catch (err) {
      console.warn('Failed to load live summary data:', err.message);
    } finally {
      setLoading(false);
    }
  }



  const formattedSales = typeof metrics.total_sales === 'number'
    ? (metrics.total_sales >= 1000000
        ? `Rs. ${(metrics.total_sales / 1000000).toFixed(1)}M`
        : `Rs. ${metrics.total_sales.toLocaleString()}`)
    : 'Rs. 0';

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
            <h3 className="text-[26px] font-semibold text-black">{loading ? '...' : formattedSales}</h3>
            <p className="text-[12px] text-[#85A6A3] font-medium mt-1">Live Database Volume</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#5B5B58] uppercase tracking-wider">Active Sellers</span>
            <span className="text-[20px]">🏬</span>
          </div>
          <div className="mt-4">
            <h3 className="text-[26px] font-semibold text-black">{loading ? '...' : metrics.active_sellers}</h3>
            <p className="text-[12px] text-[#5B5B58] mt-1">Verified suppliers</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#5B5B58] uppercase tracking-wider">Pending Approvals</span>
            <span className="text-[20px]">🛡️</span>
          </div>
          <div className="mt-4">
            <h3 className="text-[26px] font-semibold text-[#C6564D]">{loading ? '...' : metrics.pending_approvals}</h3>
            <p className="text-[12px] text-[#C6564D] font-medium mt-1">Requires action</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E9E8E2] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[13px] font-medium text-[#5B5B58] uppercase tracking-wider">Active Buyers</span>
            <span className="text-[20px]">👥</span>
          </div>
          <div className="mt-4">
            <h3 className="text-[26px] font-semibold text-black">{loading ? '...' : metrics.active_buyers}</h3>
            <p className="text-[12px] text-[#85A6A3] font-medium mt-1">Registered accounts</p>
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
              <p className="text-[13px] text-[#5B5B58] mt-0.5">Highest order volumes from database</p>
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
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-[#5B5B58]">
                      Loading top performing sellers…
                    </td>
                  </tr>
                ) : topSellers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-[#85A6A3]">
                      No sellers found in database.
                    </td>
                  </tr>
                ) : (
                  topSellers.map((s) => (
                    <tr key={s.id} className="text-[14px]">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-lg">🏬</div>
                          <div>
                            <div className="font-medium text-black">{s.business_name || s.name}</div>
                            <div className="text-[12px] text-[#5B5B58]">{s.category || 'General Wholesale'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right font-medium">{s.orders || 0}</td>
                      <td className="py-4 text-right text-[#5B5B58]">
                        Rs. {typeof s.revenue === 'number' ? s.revenue.toLocaleString() : (s.revenue || 0)}
                      </td>
                      <td className="py-4 text-right">
                        {s.status === 'APPROVED' ? (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Trending Products */}
        <section className="lg:col-span-5 bg-white rounded-lg border border-[#E9E8E2] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-semibold text-black">Trending Products</h2>
              <p className="text-[13px] text-[#5B5B58] mt-0.5">Live catalog items</p>
            </div>
            <button onClick={() => onSelectTab('products')} className="text-xs text-[#85A6A3] hover:underline font-medium">
              View products
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#5B5B58]">
                Loading trending products…
              </div>
            ) : trendingProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#85A6A3]">
                No trending products in database.
              </div>
            ) : (
              trendingProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg border border-[#E9E8E2]/60 hover:translate-y-[-2px] transition-all bg-[#F9F9F6]/40">
                  <div className="h-12 w-12 rounded-[10px] bg-[#EEF3F2] flex items-center justify-center text-xl shrink-0">📦</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[14px] font-medium text-black truncate">{p.name}</h4>
                    <p className="text-[12px] text-[#5B5B58]">{p.supplierName} • MOQ: {p.moq} units</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[14px] font-semibold text-black">{p.sold || 0} sold</span>
                    <p className="text-[11px] text-[#85A6A3]">Rs. {p.price ? p.price.toLocaleString() : 0}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

