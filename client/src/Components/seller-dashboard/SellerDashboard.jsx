import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import KycTab from "./KycTab";
import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";
import SummaryTab from "./SummaryTab";
import InventoryTab from "./InventoryTab";
import AddProductModal from "./AddProductModal";
import {
  createProductRequest,
  updateProductRequest,
  saveInventoryChangesRequest,
  fetchSellerProductsRequest,
  fetchSellerOrdersRequest,
  fetchSellerProfileRequest,
  updateOrderStatusRequest,
  updateOrderProfitabilityRequest,
  applyDefaultRatesRequest,
} from "../../services/api";

export default function SellerDashboard({ onClose, currentUser, onLogout, triggerToast }) {
  const [activeTab, setActiveTab] = useState("summary"); // "summary", "kyc", "orders", "products", "inventory"
  const [sellerProfile, setSellerProfile] = useState(currentUser?.profile || null);
  const [kycStatus, setKycStatus] = useState(currentUser?.profile?.current_status || "Approved");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingInventory, setIsSavingInventory] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Load live seller profile, products, and orders from Supabase database on mount
  useEffect(() => {
    async function loadLiveData() {
      setLoadingData(true);
      try {
        const [profileRes, dbProducts, dbOrders] = await Promise.all([
          fetchSellerProfileRequest().catch(() => null),
          fetchSellerProductsRequest().catch(() => []),
          fetchSellerOrdersRequest().catch(() => []),
        ]);

        if (profileRes) {
          setSellerProfile(profileRes);
          if (profileRes.current_status) {
            setKycStatus(profileRes.current_status === "APPROVED" ? "Approved" : profileRes.current_status);
          }
        }

        if (Array.isArray(dbProducts)) {
          setProducts(dbProducts);
        } else {
          setProducts([]);
        }

        if (Array.isArray(dbOrders)) {
          setOrders(dbOrders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Failed to load seller data from Supabase database:", err.message);
      } finally {
        setLoadingData(false);
      }
    }
    loadLiveData();
  }, [currentUser]);

  // Document Upload Handler
  const handleFileUpload = (e) => {
    e.preventDefault();
    setIsUploading(true);
    setTimeout(() => {
      setUploadedDocs((prev) => [
        ...prev,
        {
          name: "Business_License_Registration.pdf",
          size: "2.4 MB",
          date: new Date().toISOString().split("T")[0],
          status: "Pending Verification",
        },
      ]);
      setIsUploading(false);
    }, 1500);
  };

  // Save Inventory changes to Supabase database
  const handleSaveInventory = async () => {
    setIsSavingInventory(true);
    try {
      await saveInventoryChangesRequest(products);
      if (triggerToast) triggerToast("Inventory changes saved successfully!");
    } catch (err) {
      console.error("Failed to save inventory:", err.message);
      if (triggerToast) triggerToast(err.message || "Failed to save inventory", "error");
    } finally {
      setIsSavingInventory(false);
    }
  };

  // Product Inventory Stock Adjustments (Live Sync to Supabase)
  const handleAdjustStock = async (productId, delta) => {
    let finalStock = 0;
    let finalIsOut = false;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          finalStock = Math.max(0, p.stock + delta);
          finalIsOut = finalStock === 0 ? true : p.isOutOfStock;
          return {
            ...p,
            stock: finalStock,
            isOutOfStock: finalIsOut,
          };
        }
        return p;
      })
    );

    try {
      await updateProductRequest(productId, {
        stock: finalStock,
        stock_quantity: finalStock,
        isOutOfStock: finalIsOut,
        is_out_of_stock: finalIsOut,
      });
    } catch (err) {
      console.error(`Failed to sync stock adjustment for ${productId}:`, err.message);
    }
  };

  const handleToggleOutOfStock = async (productId) => {
    let nextState = false;
    let finalStock = 0;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          nextState = !p.isOutOfStock;
          finalStock = nextState ? 0 : p._prevStock !== undefined && p._prevStock > 0 ? p._prevStock : 10;
          return {
            ...p,
            isOutOfStock: nextState,
            _prevStock: p.stock,
            stock: finalStock,
          };
        }
        return p;
      })
    );

    try {
      await updateProductRequest(productId, {
        isOutOfStock: nextState,
        is_out_of_stock: nextState,
        stock: finalStock,
        stock_quantity: finalStock,
      });
    } catch (err) {
      console.error(`Failed to sync out-of-stock toggle for ${productId}:`, err.message);
    }
  };

  // Order Status transition helper (Live Sync to Supabase)
  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      await updateOrderStatusRequest(orderId, nextStatus);
    } catch (err) {
      console.error(`Failed to update order status for ${orderId}:`, err.message);
    }
  };

  // Profitability modifications (Live Sync to Supabase)
  const handleUpdateOrderProfitability = async (orderId, updatedFields) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updatedFields } : o))
    );

    try {
      await updateOrderProfitabilityRequest(orderId, updatedFields);
    } catch (err) {
      console.error(`Failed to update profitability for ${orderId}:`, err.message);
    }
  };

  const handleApplyDefaultRates = async (cogsRs, feesRs, shippingRs) => {
    setOrders((prev) =>
      prev.map((o) => ({
        ...o,
        cogs: cogsRs,
        fees: feesRs,
        shipping: shippingRs,
      }))
    );

    try {
      await applyDefaultRatesRequest(cogsRs, feesRs, shippingRs);
    } catch (err) {
      console.error("Failed to apply flat cost rules to database:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-black font-sans antialiased flex flex-col md:flex-row">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sellerProfile={sellerProfile}
        currentUser={currentUser}
        kycStatus={kycStatus}
        setKycStatus={setKycStatus}
        onClose={onClose}
      />

      <main className="flex-1 p-6 md:p-8 max-w-[1200px] overflow-y-auto">
        {loadingData ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-[#85A6A3] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[13px] text-[#5B5B58]">Loading seller workspace...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "summary" && (
              <SummaryTab
                products={products}
                orders={orders}
                sellerProfile={sellerProfile}
                onOpenAddModal={() => {
                  setEditingProduct(null);
                  setIsAddModalOpen(true);
                }}
              />
            )}

            {activeTab === "kyc" && (
              <KycTab
                kycStatus={kycStatus}
                setKycStatus={setKycStatus}
                uploadedDocs={uploadedDocs}
                handleFileUpload={handleFileUpload}
                isUploading={isUploading}
                sellerProfile={sellerProfile}
              />
            )}

            {activeTab === "orders" && (
              <OrdersTab
                orders={orders}
                handleUpdateOrderStatus={handleUpdateOrderStatus}
                onUpdateOrderProfitability={handleUpdateOrderProfitability}
                onApplyDefaultRates={handleApplyDefaultRates}
              />
            )}

            {activeTab === "inventory" && (
              <InventoryTab
                products={products}
                setProducts={setProducts}
                handleAdjustStock={handleAdjustStock}
                handleToggleOutOfStock={handleToggleOutOfStock}
                onSaveInventory={handleSaveInventory}
                isSavingInventory={isSavingInventory}
                onOpenAddModal={() => {
                  setEditingProduct(null);
                  setIsAddModalOpen(true);
                }}
              />
            )}

            {activeTab === "products" && (
              <ProductsTab
                products={products}
                setProducts={setProducts}
                handleAdjustStock={handleAdjustStock}
                handleToggleOutOfStock={handleToggleOutOfStock}
                onOpenAddModal={() => {
                  setEditingProduct(null);
                  setIsAddModalOpen(true);
                }}
                onOpenEditModal={(product) => {
                  setEditingProduct(product);
                  setIsAddModalOpen(true);
                }}
              />
            )}
          </>
        )}
      </main>

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        editingProduct={editingProduct}
        onAddProduct={async (newProd) => {
          try {
            const created = await createProductRequest(newProd);
            console.log("Product saved in Supabase database:", created);
            const savedItem = {
              id: created.id,
              name: created.title || created.name || newProd.name,
              sku: created.sku || newProd.sku,
              cat: created.categories?.name || newProd.cat || "Clothing & Apparel",
              price: parseFloat(created.price || newProd.price),
              stock: created.stock_quantity !== undefined ? created.stock_quantity : (newProd.stock || 0),
              isOutOfStock: created.is_out_of_stock !== undefined ? created.is_out_of_stock : (newProd.isOutOfStock || false),
              moq: created.moq || newProd.moq || 10,
              desc: created.description || newProd.desc || "",
              photos: created.images && created.images.length > 0 ? created.images : (newProd.photos || []),
              image: (created.images && created.images[0]) || (newProd.photos && newProd.photos[0]) || "",
            };
            setProducts((prev) => [savedItem, ...prev]);
            if (triggerToast) triggerToast("Product added to your catalog successfully!");
          } catch (err) {
            console.error("Database product save error:", err.message);
            if (triggerToast) triggerToast(err.message || "Failed to add product", "error");
          }
        }}
        onEditProduct={async (updatedProd) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === updatedProd.id ? { ...p, ...updatedProd } : p))
          );
          try {
            const updated = await updateProductRequest(updatedProd.id, updatedProd);
            console.log("Product edit persisted in Supabase database:", updated);
            if (triggerToast) triggerToast("Product updated successfully!");
          } catch (err) {
            console.error("Database product edit error:", err.message);
            if (triggerToast) triggerToast(err.message || "Failed to update product", "error");
          }
        }}
      />
    </div>
  );
}
