import React from 'react';

export default function AdminSellersPage({ onSelectTab }) {
  const sellersList = [
    { id: 1, name: 'Faisalabad Textiles Co.', email: 'faisalabad.textiles@wholesale.pk', region: 'Punjab (Faisalabad)', category: 'Clothing & Apparel', orders: 142, revenue: 'Rs. 720,000', status: 'APPROVED' },
    { id: 2, name: 'Lahore Ceramics Hub', email: 'lahore.ceramics@wholesale.pk', region: 'Punjab (Lahore)', category: 'Tiles & Construction', orders: 98, revenue: 'Rs. 580,000', status: 'APPROVED' },
    { id: 3, name: 'Khyber Leather Crafts', email: 'khyber.leather@wholesale.pk', region: 'KPK (Peshawar)', category: 'Footwear & Goods', orders: 85, revenue: 'Rs. 410,000', status: 'APPROVED' },
    { id: 4, name: 'Sindh Green Agro', email: 'sindh.green.agro@fertilizer.pk', region: 'Sindh (Hyderabad)', category: 'Agriculture & Fertilizers', orders: 64, revenue: 'Rs. 280,000', status: 'PENDING' },
    { id: 5, name: 'Multan Bedding Mills', email: 'multan.bedding@wholesale.pk', region: 'Punjab (Multan)', category: 'Bedding & Fabrics', orders: 42, revenue: 'Rs. 195,000', status: 'PENDING' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-black">Registered Sellers Directory</h2>
          <p className="text-[13px] text-[#5B5B58]">Overview of verified and pending Pakistani suppliers</p>
        </div>
        <button onClick={() => onSelectTab('approvals')} className="px-4 py-2 bg-[#A3C1BF] hover:bg-[#85A6A3] text-black text-[13px] font-medium rounded-md transition-colors">
          🛡️ View Pending Approvals
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#E9E8E2] p-6 shadow-sm">
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
                    <div className="font-medium text-black">{s.name}</div>
                    <div className="text-[12px] text-[#5B5B58]">{s.email}</div>
                  </td>
                  <td className="py-4 text-[#5B5B58]">{s.category}</td>
                  <td className="py-4 text-[#5B5B58]">{s.region}</td>
                  <td className="py-4 text-right font-medium">{s.orders}</td>
                  <td className="py-4 text-right text-[#5B5B58]">{s.revenue}</td>
                  <td className="py-4 text-center">
                    {s.status === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-0.5 rounded-full border border-[#A3C1BF]/30">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C6564D] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                        Pending Review
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
