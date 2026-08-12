import React, { useState } from "react";

export default function ApprovalsView({ onApprovalProcessed }) {
  const [pendingList, setPendingList] = useState([
    {
      id: 1,
      businessName: "Sindh Green Agro Chemical Traders",
      owner: "Tariq Mahmood",
      email: "contact@sindhgreenagro.pk",
      taxId: "NTN-2938102-D",
      address: "Plot 42, Industrial Area, Sukkur, Sindh",
      submitted: "Aug 02, 2026",
      category: "Agriculture & Fertilizers",
      initial: "SG",
    },
    {
      id: 2,
      businessName: "Khyber Craft & Leather Exporters",
      owner: "Gul Khan",
      email: "gul@khybercrafts.com",
      taxId: "NTN-9102834-K",
      address: "Shop 12, Leather Market, Peshawar",
      submitted: "Aug 05, 2026",
      category: "Leather & Goods",
      initial: "KC",
    },
    {
      id: 3,
      businessName: "Rawalpindi Tools & Hardware Mills",
      owner: "Usman Ali",
      email: "info@pinditools.pk",
      taxId: "NTN-1192834-R",
      address: "City Road, Rawalpindi, Punjab",
      submitted: "Aug 07, 2026",
      category: "Tools & Hardware",
      initial: "RT",
    },
  ]);

  const [notification, setNotification] = useState(null);

  function handleApprove(seller) {
    setPendingList((prev) => prev.filter((item) => item.id !== seller.id));
    setNotification({ type: "success", message: `Approved seller profile for ${seller.businessName}!` });
    if (onApprovalProcessed) onApprovalProcessed();
    setTimeout(() => setNotification(null), 3000);
  }

  function handleReject(seller) {
    setPendingList((prev) => prev.filter((item) => item.id !== seller.id));
    setNotification({ type: "error", message: `Rejected application for ${seller.businessName}` });
    if (onApprovalProcessed) onApprovalProcessed();
    setTimeout(() => setNotification(null), 3000);
  }

  return (
    <div className="p-8 max-w-[1240px] mx-auto space-y-6">
      {/* Alert banner */}
      {notification && (
        <div
          className={`p-4 rounded-[14px] text-xs font-medium border flex items-center justify-between ${
            notification.type === "success"
              ? "bg-[#EEF3F2] border-[#A3C1BF] text-black"
              : "bg-red-50 border-red-200 text-[#C6564D]"
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-black tracking-tight">Pending Seller Verification Requests</h2>
          <p className="text-[13px] font-normal text-[#5B5B58] mt-0.5">Review tax documents and business credentials</p>
        </div>
        <span className="bg-[#C6564D]/10 text-[#C6564D] px-3 py-1 rounded-full text-xs font-medium border border-[#C6564D]/20">
          {pendingList.length} Pending Actions
        </span>
      </div>

      {pendingList.length === 0 ? (
        <div className="bg-white p-12 rounded-[20px] border border-[#E9E8E2] text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-[#EEF3F2] border border-[#A3C1BF] flex items-center justify-center mx-auto text-[#85A6A3]">
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="text-[18px] font-semibold text-black tracking-tight">All pending seller applications reviewed!</h3>
          <p className="text-[13px] font-normal text-[#5B5B58]">There are no pending seller verification applications at this time.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {pendingList.map((seller) => (
            <div key={seller.id} className="bg-white rounded-[20px] border border-[#E9E8E2] p-6 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-[10px] bg-[#EEF3F2] border border-[#E9E8E2] flex items-center justify-center font-semibold text-black text-xs shrink-0 mt-1">
                    {seller.initial}
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-[#85A6A3] bg-[#EEF3F2] px-2.5 py-0.5 rounded-full border border-[#A3C1BF]/30">
                      {seller.category}
                    </span>
                    <h3 className="text-[18px] font-semibold text-black tracking-tight mt-2">{seller.businessName}</h3>
                    <p className="text-[13px] font-normal text-[#5B5B58] mt-0.5">
                      Owner: <span className="text-black font-medium">{seller.owner}</span> ({seller.email})
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-medium text-[#5B5B58] bg-[#F9F9F6] px-3 py-1 rounded-full border border-[#E9E8E2]">
                    Submitted: {seller.submitted}
                  </span>
                </div>
              </div>

              {/* Detail fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-[14px] bg-[#F9F9F6]/60 border border-[#E9E8E2] text-[13px]">
                <div>
                  <span className="text-[#5B5B58] block text-[11px] uppercase font-semibold tracking-wider">Tax ID / NTN</span>
                  <span className="font-mono text-black font-medium mt-1 block">{seller.taxId}</span>
                </div>
                <div>
                  <span className="text-[#5B5B58] block text-[11px] uppercase font-semibold tracking-wider">Registered Business Address</span>
                  <span className="text-black font-medium mt-1 block">{seller.address}</span>
                </div>
              </div>

              {/* Document verification status checklist */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[#5B5B58] uppercase tracking-wider">Verification Checklist</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
                  <div className="p-3 rounded-[12px] bg-white border border-[#E9E8E2] flex items-center gap-2.5 font-medium text-black shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-[#EEF3F2] text-[#85A6A3] flex items-center justify-center text-xs border border-[#A3C1BF]/30">✓</span> NTN Record Match
                  </div>
                  <div className="p-3 rounded-[12px] bg-white border border-[#E9E8E2] flex items-center gap-2.5 font-medium text-black shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-[#EEF3F2] text-[#85A6A3] flex items-center justify-center text-xs border border-[#A3C1BF]/30">✓</span> CNIC Document Verified
                  </div>
                  <div className="p-3 rounded-[12px] bg-white border border-[#E9E8E2] flex items-center gap-2.5 font-medium text-black shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-[#EEF3F2] text-[#85A6A3] flex items-center justify-center text-xs border border-[#A3C1BF]/30">✓</span> Bank Account Ownership
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9E8E2]">
                <button
                  onClick={() => handleReject(seller)}
                  className="px-4 py-2 rounded-[12px] border border-red-200 text-[#C6564D] text-[13px] font-medium bg-white hover:bg-red-50 transition-colors cursor-pointer shadow-2xs"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => handleApprove(seller)}
                  className="px-4 py-2 rounded-[12px] bg-[#A3C1BF] hover:bg-[#85A6A3] text-black text-[13px] font-medium transition-colors shadow-2xs border border-[#85A6A3] cursor-pointer"
                >
                  Approve Seller
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
