import React, { useState, useMemo } from "react";

export default function OrdersTab({
  orders = [],
  handleUpdateOrderStatus,
  onUpdateOrderProfitability,
  onApplyDefaultRates,
}) {
  // Local state for flat PKR default cost/fees inputs
  const [defaultCogs, setDefaultCogs] = useState(0);
  const [defaultFees, setDefaultFees] = useState(0);
  const [defaultShipping, setDefaultShipping] = useState(0);

  const handleApplyDefaults = () => {
    if (onApplyDefaultRates) {
      onApplyDefaultRates(defaultCogs, defaultFees, defaultShipping);
    }
  };

  // Status Summary Count Calculations
  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let shipped = 0;
    let cancelled = 0;

    orders.forEach((order) => {
      if (order.status === "Pending Verification") pending++;
      else if (order.status === "Approved") approved++;
      else if (order.status === "Shipped") shipped++;
      else if (order.status === "Cancelled") cancelled++;
    });

    return { pending, approved, shipped, cancelled };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <h1 className="text-[24px] font-semibold text-black tracking-tight">Wholesale Orders & Profitability</h1>
        <p className="text-[13px] text-[#5B5B58] mt-0.5">
          Track bulk purchases, update order status, and adjust financial records to manage margins.
        </p>
      </div>

      {/* 1. ORDER STATUS SUMMARY GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#EEF3F2]/50 border border-[#85A6A3]/20 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider block">Pending Verification</span>
          <span className="text-2xl font-black text-amber-700 block mt-1">{counts.pending}</span>
        </div>

        <div className="bg-[#EEF3F2]/50 border border-[#85A6A3]/20 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider block">Approved Orders</span>
          <span className="text-2xl font-black text-emerald-700 block mt-1">{counts.approved}</span>
        </div>

        <div className="bg-[#EEF3F2]/50 border border-[#85A6A3]/20 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider block">Shipped Orders</span>
          <span className="text-2xl font-black text-blue-700 block mt-1">{counts.shipped}</span>
        </div>

        <div className="bg-[#EEF3F2]/50 border border-[#85A6A3]/20 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-[#5B5B58] uppercase tracking-wider block">Cancelled Orders</span>
          <span className="text-2xl font-black text-rose-700 block mt-1">{counts.cancelled}</span>
        </div>
      </div>

      {/* 2. DEFAULT PROFITABILITY RULES CONTAINER (FLAT PKR) */}
      {orders.length > 0 && (
        <div className="bg-[#EEF3F2]/50 border border-[#85A6A3]/25 rounded-[20px] p-5">
          <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#85A6A3] mb-3">
            Default Profitability Calculator Rules (Flat PKR)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[12px] text-[#5B5B58] font-medium block mb-1">
                Default Cost of Goods (Rs.)
              </label>
              <input
                type="number"
                value={defaultCogs}
                onChange={(e) => setDefaultCogs(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-10 px-3 text-[13px] font-semibold border border-[#E9E8E2] rounded-[10px] bg-white focus:outline-none focus:ring-1 focus:ring-[#85A6A3]"
              />
            </div>
            <div>
              <label className="text-[12px] text-[#5B5B58] font-medium block mb-1">
                Estimated Marketplace Fee (Rs.)
              </label>
              <input
                type="number"
                value={defaultFees}
                onChange={(e) => setDefaultFees(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-10 px-3 text-[13px] font-semibold border border-[#E9E8E2] rounded-[10px] bg-white focus:outline-none focus:ring-1 focus:ring-[#85A6A3]"
              />
            </div>
            <div>
              <label className="text-[12px] text-[#5B5B58] font-medium block mb-1">
                Avg. Shipping Overhead (Rs.)
              </label>
              <input
                type="number"
                value={defaultShipping}
                onChange={(e) => setDefaultShipping(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-10 px-3 text-[13px] font-semibold border border-[#E9E8E2] rounded-[10px] bg-white focus:outline-none focus:ring-1 focus:ring-[#85A6A3]"
              />
            </div>
            <div>
              <button
                onClick={handleApplyDefaults}
                className="w-full h-10 bg-[#A3C1BF] hover:bg-[#85A6A3] text-black font-semibold text-[13px] rounded-[10px] transition-all active:scale-[0.98] cursor-pointer"
              >
                Apply To All Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ORDERS LIST DATASHEET WITH DROPDOWN STATUS CHANGES */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#E9E8E2] p-10 text-center flex flex-col items-center justify-center min-h-[320px] shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#EEF3F2] flex items-center justify-center text-[28px] mb-4 text-[#85A6A3]">
            🛒
          </div>
          <h3 className="text-[18px] font-semibold text-black">No wholesale orders yet</h3>
          <p className="text-[13px] text-[#5B5B58] max-w-[380px] mt-1 leading-relaxed">
            When buyers place bulk wholesale orders for your listed products, they will appear here with full line-item details and margin calculators.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] border border-[#E9E8E2] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F9F9F6] border-b border-[#E9E8E2]">
                  <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Order ID</th>
                  <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Buyer Name</th>
                  <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Items</th>
                  <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Total Value</th>
                  <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Cost (COGS)</th>
                  <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">LD Fees</th>
                  <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Shipping</th>
                  <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Returns</th>
                  <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58] text-center">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E8E2]">
                {orders.map((order) => {
                  const cogs = order.cogs ?? 0;
                  const fees = order.fees ?? 0;
                  const shipping = order.shipping ?? 0;
                  const returns = order.returns ?? 0;

                  const handleFieldChange = (field, val) => {
                    const numVal = Math.max(0, parseInt(val) || 0);
                    if (onUpdateOrderProfitability) {
                      onUpdateOrderProfitability(order.id, { [field]: numVal });
                    }
                  };

                  return (
                    <tr key={order.id} className="hover:bg-[#EEF3F2]/20 transition-colors">
                      <td className="p-4 text-[13px] font-semibold text-black">{order.id}</td>
                      <td className="p-4 text-[13px] font-medium text-black">{order.buyer}</td>
                      <td className="p-4 text-[13px] text-[#5B5B58] max-w-[150px] truncate">{order.items}</td>
                      <td className="p-4 text-[13px] font-semibold text-black">Rs. {order.total.toLocaleString()}</td>

                      {/* Cost Input */}
                      <td className="p-4">
                        <input
                          type="number"
                          value={cogs}
                          onChange={(e) => handleFieldChange("cogs", e.target.value)}
                          className="w-20 h-8 px-2 text-[12px] font-semibold border border-[#E9E8E2] rounded-[6px] focus:outline-none"
                        />
                      </td>

                      {/* Fees Input */}
                      <td className="p-4">
                        <input
                          type="number"
                          value={fees}
                          onChange={(e) => handleFieldChange("fees", e.target.value)}
                          className="w-16 h-8 px-2 text-[12px] font-semibold border border-[#E9E8E2] rounded-[6px] focus:outline-none"
                        />
                      </td>

                      {/* Shipping Input */}
                      <td className="p-4">
                        <input
                          type="number"
                          value={shipping}
                          onChange={(e) => handleFieldChange("shipping", e.target.value)}
                          className="w-16 h-8 px-2 text-[12px] font-semibold border border-[#E9E8E2] rounded-[6px] focus:outline-none"
                        />
                      </td>

                      {/* Returns Input */}
                      <td className="p-4">
                        <input
                          type="number"
                          value={returns}
                          onChange={(e) => handleFieldChange("returns", e.target.value)}
                          className="w-16 h-8 px-2 text-[12px] font-semibold border border-[#E9E8E2] rounded-[6px] focus:outline-none"
                        />
                      </td>

                      {/* Select Status Dropdown Selector */}
                      <td className="p-4 text-center">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border focus:outline-none transition-colors cursor-pointer ${
                            order.status === "Shipped"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : order.status === "Approved"
                              ? "bg-emerald-50 text-[#85A6A3] border border-[#85A6A3]/30"
                              : order.status === "Cancelled"
                              ? "bg-rose-50 text-rose-700 border-rose-250"
                              : "bg-amber-50 text-amber-700 border border-amber-250"
                          }`}
                        >
                          <option value="Pending Verification">Pending Verification</option>
                          <option value="Approved">Approved</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
