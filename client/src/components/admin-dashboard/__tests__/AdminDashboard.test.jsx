import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AdminSidebar from "../AdminSidebar";
import AdminHeader from "../AdminHeader";
import SummaryView from "../../../pages/admin-dashboard/views/SummaryView";
import ProductsView from "../../../pages/admin-dashboard/views/ProductsView";
import SellersView from "../../../pages/admin-dashboard/views/SellersView";
import ApprovalsView from "../../../pages/admin-dashboard/views/ApprovalsView";
import BuyersView from "../../../pages/admin-dashboard/views/BuyersView";
import AdminDashboard from "../../../pages/admin-dashboard/AdminDashboard";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runAdminDashboardUnitTests() {
  console.log("Starting Admin Dashboard unit tests...");

  // 1. Test AdminSidebar render
  const sidebarHtml = renderToStaticMarkup(
    <AdminSidebar activeTab="summary" pendingCount={3} />
  );
  assert(sidebarHtml.includes("Summary"), "Sidebar must render 'Summary' tab");
  assert(sidebarHtml.includes("Approvals"), "Sidebar must render 'Approvals' tab");
  assert(sidebarHtml.includes("3"), "Sidebar must render pending counter badge '3'");

  // 2. Test AdminHeader render
  const headerHtml = renderToStaticMarkup(
    <AdminHeader title="Dashboard Summary" onExportPNG={() => {}} />
  );
  assert(headerHtml.includes("Dashboard Summary"), "Header must display passed title");
  assert(headerHtml.includes("Export PNG"), "Header must include Export PNG button");

  // 3. Test SummaryView render
  const summaryHtml = renderToStaticMarkup(<SummaryView onNavigateTab={() => {}} />);
  assert(summaryHtml.includes("Rs. 2.4M"), "SummaryView must display sales metric");
  assert(summaryHtml.includes("Faisalabad Textiles Co."), "SummaryView must render top sellers");

  // 4. Test ProductsView render
  const productsHtml = renderToStaticMarkup(<ProductsView />);
  assert(productsHtml.includes("Glazed Porcelain Floor Tiles"), "ProductsView must render catalog products");
  assert(productsHtml.includes("Total Listings"), "ProductsView must render stat bar");

  // 5. Test SellersView render
  const sellersHtml = renderToStaticMarkup(<SellersView />);
  assert(sellersHtml.includes("Lahore Ceramics Hub"), "SellersView must render seller directory");

  // 6. Test ApprovalsView render
  const approvalsHtml = renderToStaticMarkup(<ApprovalsView />);
  assert(approvalsHtml.includes("Sindh Green Agro Chemical Traders"), "ApprovalsView must render pending seller applications");

  // 7. Test BuyersView render
  const buyersHtml = renderToStaticMarkup(<BuyersView />);
  assert(buyersHtml.includes("Al-Fateh Shopping Galleria"), "BuyersView must render buyer directory");

  // 8. Test AdminDashboard layout orchestrator
  const dashboardHtml = renderToStaticMarkup(<AdminDashboard initialTab="summary" />);
  assert(dashboardHtml.includes("LainDain"), "AdminDashboard must render sidebar brand");
  assert(dashboardHtml.includes("Dashboard Summary"), "AdminDashboard must render header title");

  console.log("✅ All Admin Dashboard unit tests passed successfully!");
}

// Execute tests if invoked directly in Node / runner
if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
  runAdminDashboardUnitTests();
}
