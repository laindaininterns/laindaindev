import React from "react";

export default function Sidebar({
  activeTab,
  setActiveTab,
  sellerProfile,
  currentUser,
  kycStatus,
  setKycStatus,
  onClose,
}) {
  const businessName =
    sellerProfile?.business_name ||
    currentUser?.profile?.business_name ||
    currentUser?.name ||
    "Wholesale Supplier";

  const supplierId =
    sellerProfile?.id
      ? `SUP-${sellerProfile.id.substring(0, 6).toUpperCase()}`
      : currentUser?.profile?.id
      ? `SUP-${currentUser.profile.id.substring(0, 6).toUpperCase()}`
      : currentUser?.id
      ? `SUP-${currentUser.id.substring(0, 6).toUpperCase()}`
      : "SUP-10024";

  const displayStatus =
    sellerProfile?.current_status ||
    currentUser?.profile?.current_status ||
    kycStatus ||
    "APPROVED";

  const isApproved = displayStatus === "APPROVED" || displayStatus === "Approved";

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
        <h3 className="font-semibold text-[15px] text-black line-clamp-1">{businessName}</h3>
        <p className="text-[12px] text-[#5B5B58] mt-0.5">Supplier ID: #{supplierId}</p>

        {/* Status Badge */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-[#5B5B58]">Status:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
              isApproved
                ? "bg-[#A3C1BF]/20 text-[#85A6A3] border border-[#85A6A3]/30"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {isApproved ? "Approved" : "Pending Review"}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        <button
          onClick={() => setActiveTab("summary")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all ${
            activeTab === "summary"
              ? "bg-[#A3C1BF] text-black font-semibold"
              : "text-[#5B5B58] hover:bg-black/5 hover:text-black"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
          </svg>
          <span>Summary & Insights</span>
        </button>

        <button
          onClick={() => setActiveTab("kyc")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all ${
            activeTab === "kyc"
              ? "bg-[#A3C1BF] text-black font-semibold"
              : "text-[#5B5B58] hover:bg-black/5 hover:text-black"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          <span>KYC Verification</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all ${
            activeTab === "orders"
              ? "bg-[#A3C1BF] text-black font-semibold"
              : "text-[#5B5B58] hover:bg-black/5 hover:text-black"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v4.5A2.25 2.25 0 002.25 13.5zm0 0l2.25 6h15l2.25-6" />
          </svg>
          <span>Orders Placed</span>
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all ${
            activeTab === "products"
              ? "bg-[#A3C1BF] text-black font-semibold"
              : "text-[#5B5B58] hover:bg-black/5 hover:text-black"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 001.592 0l7.336-7.336a1.125 1.125 0 000-1.592L12.75 3.659a2.25 2.25 0 00-1.591-.659zm-3.068 5.625a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" />
          </svg>
          <span>Products Management</span>
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[14px] font-medium transition-all ${
            activeTab === "inventory"
              ? "bg-[#A3C1BF] text-black font-semibold"
              : "text-[#5B5B58] hover:bg-black/5 hover:text-black"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          <span>Inventory Management</span>
        </button>
      </nav>

      {/* Close Portal Button for Desktop */}
      {onClose && (
        <div className="p-4 border-t border-[#E9E8E2]">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-[12px] border border-black text-[13px] font-medium hover:bg-black/5 transition-all active:scale-[0.97] cursor-pointer"
          >
            ← Back to Marketplace
          </button>
        </div>
      )}
    </aside>
  );
}
