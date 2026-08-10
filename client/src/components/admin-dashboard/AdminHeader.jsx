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
        <h1 className="text-[18px] font-semibold text-black">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {onExportPNG && (
          <button
            onClick={onExportPNG}
            className="px-4 py-1.5 bg-[#A3C1BF] hover:bg-[#85A6A3] transition-all text-[13px] font-medium text-black rounded-[10px] active:scale-[0.97] flex items-center gap-1.5"
          >
            📥 Export PNG
          </button>
        )}
        <span className="text-xs text-[#5B5B58] bg-[#F9F9F6] px-3 py-1.5 rounded-full border border-[#E9E8E2]">
          {currentDateStr}
        </span>
      </div>
    </header>
  );
}
