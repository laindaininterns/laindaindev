import React from "react";

export default function AdminHeader({ title, onExportPNG }) {
  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="h-[64px] border-b border-[#E9E8E2] bg-white flex items-center justify-between px-8 sticky top-0 z-20">
      <div>
        <h1 className="text-[20px] font-bold text-black tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {onExportPNG && (
          <button
            onClick={onExportPNG}
            className="px-4 py-2 bg-[#EEF3F2] hover:bg-[#A3C1BF] text-black border border-[#E9E8E2] hover:border-[#85A6A3] transition-all text-[13px] font-semibold rounded-[12px] active:scale-[0.97] flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export PNG</span>
          </button>
        )}
        <span className="text-xs font-semibold text-[#5B5B58] bg-[#F9F9F6] px-3.5 py-1.5 rounded-full border border-[#E9E8E2]">
          {currentDateStr}
        </span>
      </div>
    </header>
  );
}
