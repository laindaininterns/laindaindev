import React from "react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-[480px] bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-[#E9E8E2] p-8">
        <div className="h-16 w-16 mx-auto mb-4 rounded-[20px] bg-[#EEF3F2] border border-[#E9E8E2] flex items-center justify-center text-[28px]">
          🔍
        </div>
        <h1 className="text-[32px] font-bold text-black tracking-tight">404</h1>
        <h2 className="text-[18px] font-semibold text-black mt-1">Page Not Found</h2>
        <p className="text-[14px] text-[#5B5B58] mt-2 leading-relaxed">
          The page or product link you followed could not be found on LainDain Marketplace.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex h-[46px] items-center justify-center px-6 rounded-[14px] bg-[#A3C1BF] text-black font-medium text-[14px] hover:bg-[#85A6A3] transition-colors"
        >
          ← Return to Marketplace
        </a>
      </div>
      <p className="text-[12px] text-[#5B5B58] mt-6">
        LainDain (Land10) — Pakistan's B2B Wholesale Platform
      </p>
    </div>
  );
}
