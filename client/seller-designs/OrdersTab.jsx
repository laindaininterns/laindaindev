import React from "react";

export default function OrdersTab({ orders, handleUpdateOrderStatus }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-black tracking-tight">Wholesale Orders</h1>
        <p className="text-[13px] text-[#5B5B58] mt-0.5">
          Track and dispatch bulk purchase requests from buyers across Pakistan.
        </p>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-[24px] border border-[#E9E8E2] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F6] border-b border-[#E9E8E2]">
                <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Order ID</th>
                <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Buyer Name</th>
                <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Items</th>
                <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Total Value</th>
                <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58]">Status</th>
                <th className="p-4 text-[12px] font-semibold uppercase tracking-wider text-[#5B5B58] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E8E2]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#EEF3F2]/20 transition-colors">
                  <td className="p-4 text-[13px] font-semibold text-black">{order.id}</td>
                  <td className="p-4 text-[13px] font-medium text-black">{order.buyer}</td>
                  <td className="p-4 text-[13px] text-[#5B5B58] max-w-[200px] truncate">{order.items}</td>
                  <td className="p-4 text-[13px] font-semibold text-black">Rs. {order.total.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      order.status === "Shipped"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : order.status === "Approved"
                        ? "bg-[#A3C1BF]/20 text-[#85A6A3] border border-[#85A6A3]/30"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === "Pending Verification" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "Approved")}
                          className="h-8 px-3 rounded-[8px] bg-[#A3C1BF] text-black text-[12px] font-medium hover:bg-[#85A6A3] transition-all active:scale-[0.97]"
                        >
                          Approve
                        </button>
                      )}
                      {order.status === "Approved" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "Shipped")}
                          className="h-8 px-3 rounded-[8px] bg-black text-white text-[12px] font-medium hover:bg-neutral-800 transition-all active:scale-[0.97]"
                        >
                          Ship Order
                        </button>
                      )}
                      {order.status !== "Shipped" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "Cancelled")}
                          className="h-8 px-2 rounded-[8px] border border-red-200 text-red-600 hover:bg-red-50 text-[12px] font-medium transition-all"
                        >
                          Cancel
                        </button>
                      )}
                      {order.status === "Shipped" && (
                        <span className="text-[12px] text-[#5B5B58] italic">Completed</span>
                      )}
                    </div>
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
