import React from "react";

export default function AdminSidebar({ activeTab, onTabChange, pendingCount = 3, onExitAdmin }) {
  const navItems = [
    {
      id: "summary",
      label: "Summary",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: "products",
      label: "Products",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
    },
    {
      id: "sellers",
      label: "Sellers",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
          <path d="M2 7h20" />
        </svg>
      ),
    },
    {
      id: "approvals",
      label: "Approvals",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      badge: pendingCount,
    },
    {
      id: "buyers",
      label: "Buyers",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-[280px] bg-white border-r border-[#E9E8E2] flex flex-col fixed h-full z-30 select-none">
      {/* Brand Header */}
      <div className="h-[64px] border-b border-[#E9E8E2] flex items-center justify-between px-6">
        <button
          onClick={() => onTabChange("summary")}
          className="flex items-center gap-2.5 font-bold text-[18px] tracking-tight hover:opacity-80 transition-opacity"
        >
          <span className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[8px] text-[12px] font-extrabold text-black bg-[#A3C1BF]">
            LD
          </span>
          <span className="text-black font-bold tracking-tight">
            LainDain{" "}
            <span className="text-[11px] font-semibold text-[#5B5B58] px-2 py-0.5 rounded-full bg-[#EEF3F2] border border-[#E9E8E2] ml-1">
              Admin
            </span>
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] font-semibold transition-all text-left ${
                isActive
                  ? "bg-[#EEF3F2] text-black font-bold border-l-4 border-[#85A6A3] shadow-xs"
                  : "text-[#5B5B58] hover:bg-[#F9F9F6] hover:text-black font-medium"
              }`}
            >
              <span className={`w-5 h-5 flex items-center justify-center ${isActive ? "text-black" : "text-[#5B5B58]"}`}>
                {item.icon}
              </span>
              <span className="flex-1 min-w-0 truncate">{item.label}</span>
              {item.badge ? (
                <span className="bg-[#C6564D]/10 text-[#C6564D] text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer & Exit Option */}
      <div className="p-4 border-t border-[#E9E8E2] bg-[#F9F9F6]/50 space-y-3">
        {onExitAdmin && (
          <button
            onClick={onExitAdmin}
            className="w-full h-[38px] px-3 rounded-[12px] bg-white border border-[#E9E8E2] text-[13px] font-semibold text-[#5B5B58] hover:text-black hover:bg-[#EEF3F2] hover:border-[#85A6A3] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#5B5B58]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8L22 12L18 16" />
              <path d="M2 12H22" />
            </svg>
            <span>Return to Marketplace</span>
          </button>
        )}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-10 w-10 rounded-full bg-[#A3C1BF] flex items-center justify-center font-bold text-black text-sm border border-[#85A6A3]">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] font-bold leading-none truncate text-black">Admin User</h4>
            <span className="text-[11px] font-medium text-[#5B5B58] truncate block mt-1">
              system_admin@laindain.com
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
