import React from "react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  kycStatus,
  setKycStatus,
  onClose,
  onLogout
}) {
  return (
    <aside className="w-full md:w-64 bg-white border-r border-[#E9E8E2] p-5 flex flex-col justify-between shrink-0">
      <div>
        {/* Header Branding */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E9E8E2]">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-[#A3C1BF] flex items-center justify-center text-black font-bold text-xs">
              LD
            </span>
            <span className="font-semibold text-black text-lg">Seller Portal</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#5B5B58] hover:text-black text-sm font-medium"
            >
              ✕
            </button>
          )}
        </div>

        {/* KYC Verification Status Badge */}
        <div className="mb-6 p-3 rounded-lg bg-[#F9F9F6] border border-[#E9E8E2]">
          <div className="text-[11px] font-semibold uppercase text-[#5B5B58] mb-1">
            KYC Status
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                kycStatus === "Approved" || kycStatus === "APPROVED"
                  ? "bg-[#EEF3F2] text-[#85A6A3] border-[#A3C1BF]/30"
                  : "bg-red-50 text-[#C6564D] border-red-200"
              }`}
            >
              {kycStatus === "Approved" || kycStatus === "APPROVED" ? "✓ Approved" : "⏳ Pending"}
            </span>
            <button
              onClick={() =>
                setKycStatus((prev) =>
                  prev === "Approved" || prev === "APPROVED"
                    ? "Pending Verification"
                    : "Approved"
                )
              }
              className="text-[10px] text-[#85A6A3] hover:underline font-medium"
            >
              Toggle
            </button>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab("kyc")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
              activeTab === "kyc"
                ? "bg-[#EEF3F2] text-black font-semibold border-l-4 border-[#85A6A3]"
                : "text-[#5B5B58] hover:bg-[#F9F9F6] hover:text-black"
            }`}
          >
            <span className="text-base">🛡️</span>
            <span>KYC & Verification</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
              activeTab === "orders"
                ? "bg-[#EEF3F2] text-black font-semibold border-l-4 border-[#85A6A3]"
                : "text-[#5B5B58] hover:bg-[#F9F9F6] hover:text-black"
            }`}
          >
            <span className="text-base">📦</span>
            <span>Purchase Orders</span>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
              activeTab === "products"
                ? "bg-[#EEF3F2] text-black font-semibold border-l-4 border-[#85A6A3]"
                : "text-[#5B5B58] hover:bg-[#F9F9F6] hover:text-black"
            }`}
          >
            <span className="text-base">🏬</span>
            <span>Inventory Catalog</span>
          </button>
        </nav>
      </div>

      {/* Footer Switch View or Logout */}
      <div className="pt-4 border-t border-[#E9E8E2] mt-6 space-y-2">
        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-[#5B5B58] hover:text-black bg-[#F9F9F6] rounded-lg border border-[#E9E8E2] transition-colors"
          >
            ← Wholesale Store
          </button>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full py-2 text-xs font-medium text-[#C6564D] hover:bg-red-50 rounded-lg transition-colors"
          >
            Log Out
          </button>
        )}
      </div>
    </aside>
  );
}
