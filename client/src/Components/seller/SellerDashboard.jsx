import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import KycTab from "./KycTab";
import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";
import AddProductModal from "./AddProductModal";
import { fetchSellerKyc, fetchSellerProducts, fetchSellerOrders } from "../../services/api";

const INITIAL_PRODUCTS = [];
const INITIAL_ORDERS = [];

export default function SellerDashboard({ currentUser, onClose, onLogout, triggerToast }) {
  const [activeTab, setActiveTab] = useState("kyc"); // "kyc", "orders", "products"
  const [kycStatus, setKycStatus] = useState("Approved");
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadSellerDashboardData();
  }, []);

  async function loadSellerDashboardData() {
    try {
      const kycData = await fetchSellerKyc();
      if (kycData && kycData.status) {
        setKycStatus(kycData.status);
      }
    } catch (err) {
      console.warn("Seller KYC fetch info:", err.message);
    }

    try {
      const productsData = await fetchSellerProducts();
      if (productsData && productsData.length > 0) {
        const mapped = productsData.map((p) => ({
          id: p.id,
          name: p.title || p.name,
          sku: p.sku || `SKU-${p.id.substring(0, 5).toUpperCase()}`,
          cat: p.cat || p.category_id || "Wholesale Catalog",
          price: p.price,
          stock: p.stock_quantity !== undefined ? p.stock_quantity : (p.stock || 0),
          isOutOfStock: p.status === "OUT_OF_STOCK" || p.stock_quantity === 0 || p.stock === 0,
          moq: p.moq || 10,
          photos: p.images || p.photos || [],
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.warn("Seller Products fetch info:", err.message);
    }

    try {
      const ordersData = await fetchSellerOrders();
      if (ordersData && ordersData.length > 0) {
        setOrders(ordersData);
      }
    } catch (err) {
      console.warn("Seller Orders fetch info:", err.message);
    }
  }

  const handleAdjustStock = (productId, delta) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + delta);
          return {
            ...p,
            stock: newStock,
            isOutOfStock: newStock === 0 ? true : p.isOutOfStock,
          };
        }
        return p;
      })
    );
  };

  const handleToggleOutOfStock = (productId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const nextState = !p.isOutOfStock;
          if (nextState) {
            return {
              ...p,
              isOutOfStock: nextState,
              _prevStock: p.stock,
              stock: 0,
            };
          } else {
            return {
              ...p,
              isOutOfStock: nextState,
              stock: p._prevStock !== undefined && p._prevStock > 0 ? p._prevStock : 10,
            };
          }
        }
        return p;
      })
    );
  };

  const handleUpdateOrderStatus = (orderId, nextStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-black font-sans antialiased flex flex-col md:flex-row">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        kycStatus={kycStatus}
        setKycStatus={setKycStatus}
        onClose={onClose}
        onLogout={onLogout}
      />

      <main className="flex-1 p-6 md:p-8 max-w-[1200px] overflow-y-auto">
        {activeTab === "kyc" && (
          <KycTab
            kycStatus={kycStatus}
            setKycStatus={setKycStatus}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === "orders" && (
          <OrdersTab
            orders={orders}
            handleUpdateOrderStatus={handleUpdateOrderStatus}
            triggerToast={triggerToast}
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
            triggerToast={triggerToast}
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
        onAddProduct={(newProd) => setProducts((prev) => [...prev, newProd])}
        onEditProduct={(updatedProd) =>
          setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)))
        }
        triggerToast={triggerToast}
      />
    </div>
  );
}

