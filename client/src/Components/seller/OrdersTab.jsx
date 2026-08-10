import React, { useState, useEffect } from "react";
import { fetchSellerOrders, updateSellerOrderStatusRequest } from "../../services/api";

export default function OrdersTab({ orders: initialOrders, handleUpdateOrderStatus, triggerToast }) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await fetchSellerOrders();
      if (data && data.length > 0) {
        setOrders(data);
      }
    } catch (err) {
      console.warn("Using initial orders state:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onUpdateStatus(orderId, nextStatus) {
    try {
      await updateSellerOrderStatusRequest(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      if (handleUpdateOrderStatus) handleUpdateOrderStatus(orderId, nextStatus);
      if (triggerToast) triggerToast(`Order ${orderId} updated to ${nextStatus}!`);
    } catch (err) {
      if (triggerToast) triggerToast(`Error: ${err.message}`, "error");
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "All") return true;
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-black">Wholesale Purchase Orders</h2>
          <p className="text-xs text-[#5B5B58] mt-0.5">Manage purchase orders placed by verified retail buyers across Pakistan</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-[38px] px-3 text-xs rounded-lg border border-[#E9E8E2] outline-none bg-white font-medium"
        >
          <option value="All">All Order Statuses</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Approved">Approved</option>
          <option value="Shipped">Shipped</option>
        </select>
      </div>

      <div className="bg-white border border-[#E9E8E2] rounded-lg p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs font-medium text-[#5B5B58]">Loading seller orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-xs font-medium text-[#5B5B58] bg-[#F9F9F6] rounded-lg border border-[#E9E8E2]">
            No purchase orders matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E8E2] text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider pb-3">
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Retail Buyer</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Items Snapshot</th>
                  <th className="pb-3 text-right">Order Total</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E8E2]">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="text-xs hover:bg-[#F9F9F6]/50 transition-colors">
                    <td className="py-4 font-bold text-black">{o.id}</td>
                    <td className="py-4 font-medium text-black">{o.buyer}</td>
                    <td className="py-4 text-[#5B5B58]">{o.date}</td>
                    <td className="py-4 text-[#5B5B58]">{o.items}</td>
                    <td className="py-4 text-right font-bold text-black">Rs. {o.total.toLocaleString()}</td>
                    <td className="py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          o.status === "Approved"
                            ? "bg-[#EEF3F2] text-[#85A6A3] border-[#A3C1BF]/30"
                            : o.status === "Shipped"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-red-50 text-[#C6564D] border-red-200"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {o.status === "Pending Verification" && (
                        <button
                          onClick={() => onUpdateStatus(o.id, "Approved")}
                          className="px-3 py-1.5 bg-[#A3C1BF] hover:bg-[#85A6A3] text-black rounded-md text-[11px] font-semibold transition-colors"
                        >
                          Approve Order
                        </button>
                      )}
                      {o.status === "Approved" && (
                        <button
                          onClick={() => onUpdateStatus(o.id, "Shipped")}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold transition-colors"
                        >
                          Mark Shipped →
                        </button>
                      )}
                      {o.status === "Shipped" && (
                        <span className="text-[11px] font-medium text-blue-600">✓ Shipped & Dispatched</span>
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
