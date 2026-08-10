import React, { useState } from "react";
import Sidebar from "./Sidebar";
import KycTab from "./KycTab";
import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";
import AddProductModal from "./AddProductModal";

// Mock initial data for products matching the LainDain catalog style
const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Cotton Fabric Rolls (100% Combed)",
    sku: "TX-COT-01",
    cat: "Clothing & Apparel",
    price: 850,
    stock: 250,
    isOutOfStock: false,
    moq: 50,
  },
  {
    id: 2,
    name: "Glazed Ceramic Vases",
    sku: "CR-GLZ-02",
    cat: "Home Decor",
    price: 1200,
    stock: 45,
    isOutOfStock: false,
    moq: 10,
  },
  {
    id: 3,
    name: "Embroidered Kurta Dupatta Set",
    sku: "TX-EMB-03",
    cat: "Clothing & Apparel",
    price: 2450,
    stock: 0,
    isOutOfStock: true,
    moq: 20,
  },
  {
    id: 4,
    name: "Leather Messenger Bags",
    sku: "BG-LTH-04",
    cat: "Bags & Luggage",
    price: 3200,
    stock: 80,
    isOutOfStock: false,
    moq: 15,
  }
];

const INITIAL_ORDERS = [
  {
    id: "ORD-9982",
    buyer: "Karachi Retail Hub",
    date: "2026-08-09",
    items: "Cotton Fabric Rolls (x50)",
    total: 42500,
    status: "Pending Verification",
  },
  {
    id: "ORD-9975",
    buyer: "Lahore Boutique Association",
    date: "2026-08-08",
    items: "Leather Messenger Bags (x15), Glazed Ceramic Vases (x10)",
    total: 60000,
    status: "Approved",
  },
  {
    id: "ORD-9951",
    buyer: "Islamabad Lifestyle Store",
    date: "2026-08-05",
    items: "Cotton Fabric Rolls (x100)",
    total: 85000,
    status: "Shipped",
  }
];

export default function SellerDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState("kyc"); // "kyc", "orders", "products"
  const [kycStatus, setKycStatus] = useState("Pending Verification"); // "Approved", "Pending Verification"
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState([
    { name: "NTN_Certificate_2026.pdf", size: "1.2 MB", date: "2026-08-01", status: "Approved" },
    { name: "CNIC_Copy_Front_Back.pdf", size: "850 KB", date: "2026-08-01", status: "Approved" },
  ]);
  const [isUploading, setIsUploading] = useState(false);

  // Document Upload Handler
  const handleFileUpload = (e) => {
    e.preventDefault();
    setIsUploading(true);
    setTimeout(() => {
      setUploadedDocs(prev => [
        ...prev,
        {
          name: "Business_License_Registration.pdf",
          size: "2.4 MB",
          date: new Date().toISOString().split('T')[0],
          status: "Pending Verification"
        }
      ]);
      setIsUploading(false);
    }, 1500);
  };

  // Product Inventory Handlers
  const handleAdjustStock = (productId, delta) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const newStock = Math.max(0, p.stock + delta);
          return {
            ...p,
            stock: newStock,
            // Automatically mark out of stock if it reaches 0
            isOutOfStock: newStock === 0 ? true : p.isOutOfStock
          };
        }
        return p;
      })
    );
  };

  const handleToggleOutOfStock = (productId) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const nextState = !p.isOutOfStock;
          if (nextState) {
            // Toggling OUT of stock: backup current stock, set stock to 0
            return {
              ...p,
              isOutOfStock: nextState,
              _prevStock: p.stock,
              stock: 0
            };
          } else {
            // Toggling IN to stock: restore from backup, fallback to 10 if backup was 0 or undefined
            return {
              ...p,
              isOutOfStock: nextState,
              stock: (p._prevStock !== undefined && p._prevStock > 0) ? p._prevStock : 10
            };
          }
        }
        return p;
      })
    );
  };

  // Order Status transition helper
  const handleUpdateOrderStatus = (orderId, nextStatus) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: nextStatus } : o))
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
      />

      <main className="flex-1 p-6 md:p-8 max-w-[1200px] overflow-y-auto">
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
        onAddProduct={(newProd) => setProducts(prev => [...prev, newProd])}
        onEditProduct={(updatedProd) => setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p))}
      />
    </div>
  );
}
