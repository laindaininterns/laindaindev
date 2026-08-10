import React from "react";

export default function Sidebar({ activeTab, setActiveTab, kycStatus, setKycStatus, onClose }) {
  return (
    <aside className="w-full md:w-[280px] bg-white border-b md:border-b-0 md:border-r border-[#E9E8E2] flex flex-col shrink-0">
      {/* Brand / Close section */}
      <div className="p-6 border-b border-[#E9E8E2] flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-semibold text-[18px] tracking-tight">
          <span className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[8px] text-[12px] font-bold text-black bg-[#A3C1BF]">
            LD
          </span>
          <span className="text-black font-semibold">Seller Portal</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-[8px] hover:bg-black/5 text-[#5B5B58]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Profile Summary & KYC Status */}
      <div className="p-6 border-b border-[#E9E8E2] bg-[#EEF3F2]/50">
        <h3 className="font-semibold text-[15px] text-black">Faisalabad Textiles Co.</h3>
        <p className="text-[12px] text-[#5B5B58] mt-0.5">Supplier ID: #10024</p>
        
        {/* Status Badge */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-[#5B5B58]">Status:</span>
          <span
            onClick={() => setKycStatus(prev => prev === "Approved" ? "Pending Verification" : "Approved")}
            title="Click to toggle status for demo"
            className={`cursor-pointer px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide transition-all ${
              kycStatus === "Approved"
                ? "bg-[#A3C1BF]/20 text-[#85A6A3] border border-[#85A6A3]/30"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {kycStatus}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        <button
          onClick={() => setActiveTab("kyc")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all ${
            activeTab === "kyc"
              ? "bg-[#A3C1BF] text-black font-semibold"
              : "text-[#5B5B58] hover:bg-black/5 hover:text-black"
          }`}
        >
          🛡️ KYC Status & Docs
        </button>
        
        <button
          onClick={() => setActiveTab("orders")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all ${
            activeTab === "orders"
              ? "bg-[#A3C1BF] text-black font-semibold"
              : "text-[#5B5B58] hover:bg-black/5 hover:text-black"
          }`}
        >
          📦 Orders Placed
        </button>
        
        <button
          onClick={() => setActiveTab("products")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all ${
            activeTab === "products"
              ? "bg-[#A3C1BF] text-black font-semibold"
              : "text-[#5B5B58] hover:bg-black/5 hover:text-black"
          }`}
        >
          👕 Products & Inventory
        </button>
      </nav>

      {/* Close Portal Button for Desktop */}
      {onClose && (
        <div className="p-4 border-t border-[#E9E8E2]">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-[12px] border border-black text-[13px] font-medium hover:bg-black/5 transition-all active:scale-[0.97]"
          >
            ← Back to Marketplace
          </button>
        </div>
      )}
    </aside>
  );
}
