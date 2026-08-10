import React, { useState } from "react";
import AdminSidebar from "../../components/admin-dashboard/AdminSidebar";
import AdminHeader from "../../components/admin-dashboard/AdminHeader";
import SummaryView from "./views/SummaryView";
import ProductsView from "./views/ProductsView";
import SellersView from "./views/SellersView";
import ApprovalsView from "./views/ApprovalsView";
import BuyersView from "./views/BuyersView";

export default function AdminDashboard({ onExitAdmin, initialTab = "summary" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(3);

  const titlesMap = {
    summary: "Dashboard Summary",
    products: "Product Catalog Management",
    sellers: "Seller Directory & Status",
    approvals: "Pending Seller Verification Requests",
    buyers: "Registered Buyers Directory",
  };

  function handleExportPNG() {
    window.print();
  }

  function handleApprovalProcessed() {
    setPendingApprovalsCount((prev) => Math.max(0, prev - 1));
  }

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-black font-sans flex">
      {/* Fixed Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={pendingApprovalsCount}
        onExitAdmin={onExitAdmin}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-[280px] min-h-screen flex flex-col">
        <AdminHeader title={titlesMap[activeTab] || "Admin Dashboard"} onExportPNG={handleExportPNG} />

        <main className="flex-1 overflow-y-auto pb-12">
          {activeTab === "summary" && <SummaryView onNavigateTab={setActiveTab} />}
          {activeTab === "products" && <ProductsView />}
          {activeTab === "sellers" && <SellersView onNavigateApprovals={() => setActiveTab("approvals")} />}
          {activeTab === "approvals" && <ApprovalsView onApprovalProcessed={handleApprovalProcessed} />}
          {activeTab === "buyers" && <BuyersView />}
        </main>
      </div>
    </div>
  );
}
