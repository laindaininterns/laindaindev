import React from "react";

export default function AdminSidebar({ activeTab, onTabChange, pendingCount = 3, onExitAdmin }) {
  const navItems = [
    { id: "summary", label: "Summary", icon: "📊" },
    { id: "products", label: "Products", icon: "📦" },
    { id: "sellers", label: "Sellers", icon: "👤" },
    { id: "approvals", label: "Approvals", icon: "🛡️", badge: pendingCount },
    { id: "buyers", label: "Buyers", icon: "👥" },
  ];

  return (
    <aside className="w-[280px] bg-white border-r border-[#E9E8E2] flex flex-col fixed h-full z-30 select-none">
      {/* Brand Header */}
      <div className="h-[64px] border-b border-[#E9E8E2] flex items-center justify-between px-6">
        <button
          onClick={() => onTabChange("summary")}
          className="flex items-center gap-2.5 font-semibold text-[18px] tracking-tight hover:opacity-80 transition-opacity"
        >
          <span className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[8px] text-[12px] font-bold text-black bg-[#A3C1BF]">
            LD
          </span>
          <span className="text-black font-semibold">
            LainDain{" "}
            <span className="text-xs font-medium text-[#5B5B58] px-1.5 py-0.5 rounded bg-[#EEF3F2] ml-1">
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] transition-colors text-left ${
                isActive
                  ? "bg-[#EEF3F2] text-black font-medium border-l-4 border-[#85A6A3]"
                  : "text-[#5B5B58] hover:bg-[#F9F9F6] hover:text-black"
              }`}
            >
              <span className="text-[18px]">{item.icon}</span>
              <span className="flex-1 min-w-0 truncate">{item.label}</span>
              {item.badge ? (
                <span className="bg-[#C6564D]/10 text-[#C6564D] text-[11px] px-2 py-0.5 rounded-full font-semibold">
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
            className="w-full h-[36px] px-3 rounded-[10px] bg-white border border-[#E9E8E2] text-[13px] font-medium text-[#5B5B58] hover:text-black hover:border-[#85A6A3] transition-all flex items-center justify-center gap-2"
          >
            <span>🛍️</span> Return to Marketplace
          </button>
        )}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-10 w-10 rounded-full bg-[#A3C1BF] flex items-center justify-center font-bold text-black text-sm">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] font-semibold leading-none truncate text-black">Admin User</h4>
            <span className="text-[11px] text-[#5B5B58] truncate block mt-0.5">
              system_admin@laindain.com
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
