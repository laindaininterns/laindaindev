import React from "react";

export default function Toast({ toast }) {
  if (!toast.show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[600] flex items-center gap-2.5 rounded-[16px] px-5 py-3 text-[14px] font-medium text-white transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      style={{
        background: toast.tone === "success" ? "#000000" : "#C6564D",
        transform: "translateX(-50%)",
      }}
    >
      {toast.tone === "success" ? (
        <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="#A3C1BF" strokeWidth="2.5">
          <polyline points="4 13 9 18 20 6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      <span>{toast.message}</span>
    </div>
  );
}
