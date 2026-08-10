import React from 'react';

export default function AdminBuyersPage() {
  const buyersList = [
    { id: 1, name: 'Tariq Retailers', email: 'tariq@retail.pk', location: 'Karachi, Sindh', orders: 24, totalSpent: 'Rs. 450,000', joined: 'Jan 2026' },
    { id: 2, name: 'Al-Madina Traders', email: 'madina@traders.pk', location: 'Lahore, Punjab', orders: 18, totalSpent: 'Rs. 320,000', joined: 'Feb 2026' },
    { id: 3, name: 'Peshawar General Store', email: 'peshawar@store.pk', location: 'Peshawar, KPK', orders: 12, totalSpent: 'Rs. 210,000', joined: 'Jan 2026' },
    { id: 4, name: 'Quetta Mart', email: 'quetta@mart.pk', location: 'Quetta, Balochistan', orders: 9, totalSpent: 'Rs. 180,000', joined: 'Mar 2026' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[18px] font-semibold text-black">Active Retail Buyers Directory</h2>
        <p className="text-[13px] text-[#5B5B58]">Registered retail accounts purchasing wholesale inventory</p>
      </div>

      <div className="bg-white rounded-lg border border-[#E9E8E2] p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
                <th className="pb-3">Buyer / Store Name</th>
                <th className="pb-3">Location</th>
                <th className="pb-3 text-right">Orders Placed</th>
                <th className="pb-3 text-right">Total Volume</th>
                <th className="pb-3 text-right">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E8E2]">
              {buyersList.map((b) => (
                <tr key={b.id} className="text-[14px] hover:bg-[#F9F9F6]/50 transition-colors">
                  <td className="py-4">
                    <div className="font-medium text-black">{b.name}</div>
                    <div className="text-[12px] text-[#5B5B58]">{b.email}</div>
                  </td>
                  <td className="py-4 text-[#5B5B58]">{b.location}</td>
                  <td className="py-4 text-right font-medium">{b.orders}</td>
                  <td className="py-4 text-right text-[#5B5B58]">{b.totalSpent}</td>
                  <td className="py-4 text-right text-[#5B5B58]">{b.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
