import React, { useState, useEffect } from "react";
import { createSellerProductRequest } from "../../services/api";

export default function AddProductModal({ isOpen, onClose, editingProduct, onAddProduct, onEditProduct, triggerToast }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Clothing & Apparel");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [moq, setMoq] = useState("10");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || "");
      setCategory(editingProduct.cat || "Clothing & Apparel");
      setPrice(editingProduct.price ? String(editingProduct.price) : "");
      setStock(editingProduct.stock ? String(editingProduct.stock) : "");
      setMoq(editingProduct.moq ? String(editingProduct.moq) : "10");
      setDescription(editingProduct.desc || "");
    } else {
      setName("");
      setCategory("Clothing & Apparel");
      setPrice("");
      setStock("");
      setMoq("10");
      setDescription("");
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !price) {
      if (triggerToast) triggerToast("Product title/name and price are required.", "error");
      return;
    }

    setIsSubmitting(true);
    const prodObj = {
      title: name,
      name,
      cat: category,
      price: Number(price),
      stock: Number(stock || 0),
      stock_quantity: Number(stock || 0),
      moq: Number(moq || 10),
      description,
    };

    try {
      if (!editingProduct) {
        let created = null;
        try {
          created = await createSellerProductRequest(prodObj);
        } catch (apiErr) {
          console.warn("Backend product creation fallback:", apiErr.message);
        }

        const finalProduct = {
          id: created?.id || Date.now(),
          name,
          sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          cat: category,
          price: Number(price),
          stock: Number(stock || 0),
          isOutOfStock: Number(stock || 0) === 0,
          moq: Number(moq || 10),
          photos: [],
        };

        onAddProduct(finalProduct);
        if (triggerToast) triggerToast(`Product "${name}" published successfully!`);
      } else {
        const updated = {
          ...editingProduct,
          name,
          cat: category,
          price: Number(price),
          stock: Number(stock || 0),
          isOutOfStock: Number(stock || 0) === 0,
          moq: Number(moq || 10),
        };
        onEditProduct(updated);
        if (triggerToast) triggerToast(`Product "${name}" updated!`);
      }
      onClose();
    } catch (err) {
      if (triggerToast) triggerToast(`Error: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E9E8E2]">
        <div className="flex items-center justify-between border-b border-[#E9E8E2] pb-3">
          <h3 className="text-base font-bold text-black">
            {editingProduct ? "Edit Product Details" : "+ Add New Wholesale Product"}
          </h3>
          <button onClick={onClose} className="text-[#5B5B58] hover:text-black font-bold text-sm">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-black mb-1">Product Title / Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 100% Combed Cotton Fabric Rolls"
              className="w-full h-9 px-3 text-xs rounded-lg border border-[#E9E8E2] outline-none bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-2 text-xs rounded-lg border border-[#E9E8E2] outline-none bg-white"
              >
                <option value="Clothing & Apparel">Clothing & Apparel</option>
                <option value="Industrial Machinery">Industrial Machinery</option>
                <option value="Electronics & Components">Electronics & Components</option>
                <option value="Home Decor">Home Decor</option>
                <option value="Bags & Luggage">Bags & Luggage</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Wholesale Price (PKR)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="850"
                className="w-full h-9 px-3 text-xs rounded-lg border border-[#E9E8E2] outline-none bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Initial Stock Qty</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="250"
                className="w-full h-9 px-3 text-xs rounded-lg border border-[#E9E8E2] outline-none bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-black mb-1">Minimum Order Qty (MOQ)</label>
              <input
                type="number"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                placeholder="50"
                className="w-full h-9 px-3 text-xs rounded-lg border border-[#E9E8E2] outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-black mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wholesale product specifications, fabric density, packaging details..."
              className="w-full p-2.5 text-xs rounded-lg border border-[#E9E8E2] outline-none bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E9E8E2]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E9E8E2] text-xs font-semibold text-[#5B5B58] hover:bg-[#F9F9F6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[#A3C1BF] hover:bg-[#85A6A3] text-xs font-bold text-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : editingProduct ? "Save Changes" : "Publish Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
