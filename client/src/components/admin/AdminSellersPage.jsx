import React, { useState, useEffect } from 'react';
import { fetchAllSellers } from '../../services/api';

export default function AdminSellersPage({ onSelectTab }) {
  const [sellersList, setSellersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellers();
  }, []);

  async function loadSellers() {
    setLoading(true);
    try {
      const data = await fetchAllSellers();
      setSellersList(data || []);
    } catch (err) {
      console.warn('Failed to load live sellers:', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-black">Registered Sellers Directory</h2>
          <p className="text-[13px] text-[#5B5B58]">Overview of verified and pending Pakistani suppliers</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadSellers} className="text-xs text-[#85A6A3] hover:underline font-medium">
            🔄 Refresh Sellers
          </button>
          <button onClick={() => onSelectTab('approvals')} className="px-4 py-2 bg-[#A3C1BF] hover:bg-[#85A6A3] text-black text-[13px] font-medium rounded-md transition-colors">
            🛡️ View Pending Approvals
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E9E8E2] p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-[#5B5B58] text-sm font-medium">
            Fetching registered suppliers from database…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
                  <th className="pb-3">Business Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Region</th>
                  <th className="pb-3 text-right">Completed Orders</th>
                  <th className="pb-3 text-right">Revenue</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E8E2]">
                {sellersList.map((s) => (
                  <tr key={s.id} className="text-[14px] hover:bg-[#F9F9F6]/50 transition-colors">
                    <td className="py-4">
                      <div className="font-medium text-black">{s.business_name || s.name}</div>
                      <div className="text-[12px] text-[#5B5B58]">{s.email}</div>
                    </td>
                    <td className="py-4 text-[#5B5B58]">{s.category || 'General Wholesale'}</td>
                    <td className="py-4 text-[#5B5B58]">{s.region || 'Pakistan'}</td>
                    <td className="py-4 text-right font-medium">{s.orders || 0}</td>
                    <td className="py-4 text-right text-[#5B5B58]">
                      Rs. {typeof s.revenue === 'number' ? s.revenue.toLocaleString() : (s.revenue || 0)}
                    </td>
                    <td className="py-4 text-center">
                      {s.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-0.5 rounded-full border border-[#A3C1BF]/30">
                          ✓ Verified
                        </span>
                      ) : s.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C6564D] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          Pending Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B5B58] bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                          Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

