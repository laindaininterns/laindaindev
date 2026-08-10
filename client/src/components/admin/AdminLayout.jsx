import React from 'react';

export default function AdminLayout({ activeTab, onSelectTab, currentUser, onLogout, pendingCount, children }) {
  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'sellers', label: 'Sellers', icon: '👤' },
    { id: 'approvals', label: 'Approvals', icon: '🛡️', badge: pendingCount },
    { id: 'buyers', label: 'Buyers', icon: '👥' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F9F9F6] font-sans antialiased text-black">
      {/* Sidebar Navigation */}
      <aside className="w-[280px] bg-white border-r border-[#E9E8E2] flex flex-col fixed h-full z-30">
        <div className="h-[64px] border-b border-[#E9E8E2] flex items-center justify-between px-6">
          <a href="#" onClick={(e) => { e.preventDefault(); onSelectTab('summary'); }} className="flex items-center gap-2.5 font-semibold text-[18px]">
            <span className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[8px] text-[12px] font-bold text-black bg-[#A3C1BF]">
              LD
            </span>
            <span className="text-black font-semibold">
              LainDain <span className="text-xs font-medium text-[#5B5B58] px-1.5 py-0.5 rounded bg-[#EEF3F2] ml-1">Admin</span>
            </span>
          </a>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-[15px] transition-colors text-left ${
                  isActive
                    ? 'bg-[#EEF3F2] text-black font-semibold border-l-4 border-[#85A6A3]'
                    : 'text-[#5B5B58] hover:bg-[#F9F9F6] hover:text-black'
                }`}
              >
                <span className="text-[18px]">{t.icon}</span>
                <span>{t.label}</span>
                {t.badge > 0 && (
                  <span className="ml-auto bg-[#C6564D]/10 text-[#C6564D] text-[11px] px-2 py-0.5 rounded-full font-semibold">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-[#E9E8E2] bg-[#F9F9F6]/50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-[#A3C1BF] flex items-center justify-center font-bold text-black text-sm shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <h4 className="text-[14px] font-semibold leading-none truncate">{currentUser?.name || 'Admin User'}</h4>
              <span className="text-[11px] text-[#5B5B58] truncate block">{currentUser?.email || 'admin@laindain.org'}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="p-1.5 rounded-lg hover:bg-black/5 text-[#5B5B58] hover:text-[#C6564D] transition-colors text-xs font-semibold"
          >
            Exit
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pl-[280px]">
        <header className="h-[64px] border-b border-[#E9E8E2] bg-white flex items-center justify-between px-8 sticky top-0 z-20">
          <div>
            <h1 className="text-[18px] font-semibold text-black capitalize">
              {activeTab === 'summary' && 'Dashboard Summary'}
              {activeTab === 'approvals' && 'Seller Verification Requests'}
              {activeTab === 'sellers' && 'Sellers Directory'}
              {activeTab === 'buyers' && 'Buyers Directory'}
              {activeTab === 'products' && 'Wholesale Catalog Management'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#5B5B58] bg-[#F9F9F6] px-3 py-1.5 rounded-full border border-[#E9E8E2]">
              LainDain B2B Platform
            </span>
          </div>
        </header>

        <div className="p-8 max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
