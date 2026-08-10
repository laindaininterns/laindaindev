import React, { useState, useEffect } from "react";
import { CATEGORIES } from "../../data/marketplaceData";

export default function AddProductModal({ isOpen, onClose, onAddProduct, onEditProduct, editingProduct }) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    cat: CATEGORIES[1] || "Clothing & Apparel",
    price: "",
    moq: "",
    stock: "",
    desc: "",
    photos: []
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        // Edit Mode
        setFormData({
          name: editingProduct.name || "",
          sku: editingProduct.sku || "",
          cat: editingProduct.cat || CATEGORIES[1],
          price: editingProduct.price || "",
          moq: editingProduct.moq || "",
          stock: editingProduct.stock !== undefined ? editingProduct.stock : "",
          desc: editingProduct.desc || "",
          photos: editingProduct.photos || []
        });
      } else {
        // Add Mode
        setFormData({
          name: "",
          sku: "TX-" + Math.floor(Math.random() * 9000 + 1000),
          cat: CATEGORIES[1] || "Clothing & Apparel",
          price: "",
          moq: "",
          stock: "",
          desc: "",
          photos: []
        });
      }
      setErrors({});
    }
  }, [isOpen, editingProduct]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Photo Upload Handler (max 5)
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData.photos.length + files.length > 5) {
      setErrors((prev) => ({ ...prev, photos: "Maximum of 5 photos allowed per product." }));
      return;
    }

    const newPhotoUrls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotoUrls].slice(0, 5)
    }));
    setErrors((prev) => ({ ...prev, photos: "" }));
  };

  const handleRemovePhoto = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.price || formData.price <= 0) newErrors.price = "Enter a valid wholesale price";
    if (!formData.moq || formData.moq <= 0) newErrors.moq = "Enter a valid minimum order quantity";
    if (formData.stock === "" || formData.stock < 0) newErrors.stock = "Enter a valid stock quantity";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      name: formData.name,
      sku: formData.sku,
      cat: formData.cat,
      price: parseFloat(formData.price),
      moq: parseInt(formData.moq),
      stock: parseInt(formData.stock),
      desc: formData.desc,
      photos: formData.photos,
      isOutOfStock: parseInt(formData.stock) === 0,
    };

    if (editingProduct) {
      onEditProduct({
        ...editingProduct,
        ...payload
      });
    } else {
      onAddProduct({
        id: Date.now(),
        ...payload
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] max-h-[92vh] bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col border border-[#E9E8E2] transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 bg-[#F9F9F6] border-b border-[#E9E8E2]">
          <h2 className="text-[18px] font-semibold text-black">
            {editingProduct ? "Edit Product Details" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] hover:bg-black/5 text-black font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Product Name */}
          <div>
            <label className="block text-[13px] font-medium text-[#5B5B58] mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full h-[46px] px-3.5 rounded-[10px] border text-[14px] bg-white focus:outline-none transition-all ${
                errors.name
                  ? "border-[#C6564D] focus:border-[#C6564D] focus:ring-1 focus:ring-[#C6564D]"
                  : "border-[#E9E8E2] focus:border-[#85A6A3] focus:ring-1 focus:ring-[#85A6A3]"
              }`}
              placeholder="e.g. Premium Cotton Fabric Rolls"
            />
            {errors.name && (
              <p className="mt-1 text-[11px] text-[#C6564D]">{errors.name}</p>
            )}
          </div>

          {/* SKU & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#5B5B58] mb-1.5">
                SKU / Reference
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#E9E8E2] text-[14px] bg-neutral-50 text-neutral-500 cursor-not-allowed focus:outline-none"
                readOnly
              />
            </div>
            
            <div>
              <label className="block text-[13px] font-medium text-[#5B5B58] mb-1.5">
                Category *
              </label>
              <select
                value={formData.cat}
                onChange={(e) => handleChange("cat", e.target.value)}
                className="w-full h-[46px] px-3.5 rounded-[10px] border border-[#E9E8E2] text-[14px] bg-white focus:outline-none focus:border-[#85A6A3] focus:ring-1 focus:ring-[#85A6A3]"
              >
                {CATEGORIES.slice(1).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & MOQ Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#5B5B58] mb-1.5">
                Wholesale Price (Rs.) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                className={`w-full h-[46px] px-3.5 rounded-[10px] border text-[14px] bg-white focus:outline-none transition-all ${
                  errors.price
                    ? "border-[#C6564D] focus:border-[#C6564D] focus:ring-1 focus:ring-[#C6564D]"
                    : "border-[#E9E8E2] focus:border-[#85A6A3] focus:ring-1 focus:ring-[#85A6A3]"
                }`}
                placeholder="e.g. 850"
              />
              {errors.price && (
                <p className="mt-1 text-[11px] text-[#C6564D]">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#5B5B58] mb-1.5">
                Min. Order (MOQ) *
              </label>
              <input
                type="number"
                value={formData.moq}
                onChange={(e) => handleChange("moq", e.target.value)}
                className={`w-full h-[46px] px-3.5 rounded-[10px] border text-[14px] bg-white focus:outline-none transition-all ${
                  errors.moq
                    ? "border-[#C6564D] focus:border-[#C6564D] focus:ring-1 focus:ring-[#C6564D]"
                    : "border-[#E9E8E2] focus:border-[#85A6A3] focus:ring-1 focus:ring-[#85A6A3]"
                }`}
                placeholder="e.g. 50"
              />
              {errors.moq && (
                <p className="mt-1 text-[11px] text-[#C6564D]">{errors.moq}</p>
              )}
            </div>
          </div>

          {/* Stock Input */}
          <div>
            <label className="block text-[13px] font-medium text-[#5B5B58] mb-1.5">
              Available Stock *
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
              className={`w-full h-[46px] px-3.5 rounded-[10px] border text-[14px] bg-white focus:outline-none transition-all ${
                errors.stock
                  ? "border-[#C6564D] focus:border-[#C6564D] focus:ring-1 focus:ring-[#C6564D]"
                  : "border-[#E9E8E2] focus:border-[#85A6A3] focus:ring-1 focus:ring-[#85A6A3]"
              }`}
              placeholder="e.g. 200"
            />
            {errors.stock && (
              <p className="mt-1 text-[11px] text-[#C6564D]">{errors.stock}</p>
            )}
          </div>

          {/* Photos Upload Zone */}
          <div>
            <label className="block text-[13px] font-medium text-[#5B5B58] mb-1.5">
              Product Photos (Max 5)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative w-16 h-16 rounded-[8px] overflow-hidden border border-[#E9E8E2]">
                  <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {formData.photos.length < 5 && (
                <label className="w-16 h-16 rounded-[8px] border-2 border-dashed border-[#A3C1BF] hover:border-[#85A6A3] bg-[#EEF3F2]/30 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <span className="text-[18px] text-[#5B5B58]">+</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {errors.photos && (
              <p className="text-[11px] text-[#C6564D]">{errors.photos}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-medium text-[#5B5B58] mb-1.5">
              Product Description
            </label>
            <textarea
              value={formData.desc}
              onChange={(e) => handleChange("desc", e.target.value)}
              className="w-full h-[90px] p-3 rounded-[10px] border border-[#E9E8E2] text-[14px] bg-white focus:outline-none focus:border-[#85A6A3] focus:ring-1 focus:ring-[#85A6A3] resize-none"
              placeholder="Provide a short description of materials, options, or packaging..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#E9E8E2] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-[12px] border border-neutral-300 text-neutral-700 text-[14px] font-medium hover:bg-neutral-50 transition-all active:scale-[0.97]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 px-6 rounded-[12px] bg-[#A3C1BF] text-black text-[14px] font-semibold hover:bg-[#85A6A3] transition-all active:scale-[0.97]"
            >
              {editingProduct ? "Save Changes" : "Add Product"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
