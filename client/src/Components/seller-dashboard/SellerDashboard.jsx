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
  updateOrderStatusRequest,
  updateOrderProfitabilityRequest,
  applyDefaultRatesRequest,
} from "../../services/api";

export default function SellerDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState("summary"); // "summary", "kyc", "orders", "products"
  const [kycStatus, setKycStatus] = useState("Approved");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingInventory, setIsSavingInventory] = useState(false);

  // Load live products and orders from Supabase database on mount
  useEffect(() => {
    async function loadLiveData() {
      try {
        const [dbProducts, dbOrders] = await Promise.all([
          fetchSellerProductsRequest(),
          fetchSellerOrdersRequest(),
        ]);
        if (Array.isArray(dbProducts)) {
          setProducts(dbProducts);
        }
        if (Array.isArray(dbOrders)) {
          setOrders(dbOrders);
        }
      } catch (err) {
        console.error("Failed to load seller data from Supabase database:", err.message);
      }
    }
    loadLiveData();
  }, []);

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
      console.log("Inventory changes persisted into Supabase database.");
    } catch (err) {
      console.error("Failed to save inventory:", err.message);
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
        kycStatus={kycStatus}
        setKycStatus={setKycStatus}
        onClose={onClose}
      />

      <main className="flex-1 p-6 md:p-8 max-w-[1200px] overflow-y-auto">
        {activeTab === "summary" && (
          <SummaryTab products={products} orders={orders} />
        )}

        {activeTab === "kyc" && (
          <KycTab
            kycStatus={kycStatus}
            setKycStatus={setKycStatus}
            uploadedDocs={uploadedDocs}
            handleFileUpload={handleFileUpload}
            isUploading={isUploading}
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
      </main>

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        editingProduct={editingProduct}
        onAddProduct={async (newProd) => {
          setProducts((prev) => [...prev, newProd]);
          try {
            const created = await createProductRequest(newProd);
            console.log("Product saved in Supabase database:", created);
            if (created && created.id) {
              setProducts((prev) =>
                prev.map((p) =>
                  p.sku === newProd.sku || p.id === newProd.id
                    ? {
                        ...p,
                        id: created.id,
                        name: created.title || created.name || p.name,
                        sku: created.sku || p.sku,
                      }
                    : p
                )
              );
            }
          } catch (err) {
            console.error("Database product save error:", err.message);
          }
        }}
        onEditProduct={async (updatedProd) => {
          setProducts((prev) =>
            prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
          );
          try {
            const updated = await updateProductRequest(updatedProd.id, updatedProd);
            console.log("Product edit persisted in Supabase database:", updated);
          } catch (err) {
            console.error("Database product edit error:", err.message);
          }
        }}
      />
    </div>
  );
}
