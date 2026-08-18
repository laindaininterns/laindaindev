import React, { useState, useEffect } from "react";
import { TOKENS } from "../data/marketplaceData";
import { checkoutRequest } from "../services/api";

const REGIONS = [
  "Lahore",
  "Karachi",
  "Faisalabad",
  "Rawalpindi",
  "Islamabad",
  "Multan",
  "Gujranwala",
  "Sialkot",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Gujrat",
  "Bahawalpur",
  "Sargodha",
  "Other Cities (Punjab)",
  "Other Cities (Sindh)",
  "Other Cities (KPK)",
  "Other Cities (Balochistan)",
];

// Helper to extract a strictly valid phone number only (never a name or business string)
function extractValidPhone(user) {
  if (!user) return "";
  const candidates = [
    user.phone,
    user.phone_number,
    user.contact_number,
    user.profile?.phone_number,
    user.profile?.contact_number,
    user.profile?.phone,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      const digits = c.replace(/\D/g, "");
      // Must contain at least 10 digits and not contain letters (cannot be a company/business name)
      if (digits.length >= 10 && digits.length <= 12 && /^[0-9+\s()-]+$/.test(c.trim())) {
        return c.trim();
      }
    }
  }
  return "";
}

// Helper to extract a clean full name (not email address fallback)
function extractFullName(user) {
  if (!user) return "";
  if (user.name && typeof user.name === "string" && !user.name.includes("@")) return user.name;
  if (user.full_name && typeof user.full_name === "string") return user.full_name;
  if (user.profile?.full_name && typeof user.profile.full_name === "string") return user.profile.full_name;
  return "";
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems = [],
  cartSubtotal = 0,
  currentUser = null,
  onCompleteOrder,
  onOpenAuthModal,
}) {
  const isSignedIn = Boolean(currentUser && (currentUser.email || currentUser.id));

  const [step, setStep] = useState("form"); // "form" | "success"
  const [formData, setFormData] = useState({
    fullName: "",
    region: REGIONS[0],
    address: "",
    phone: "",
    email: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [orderResult, setOrderResult] = useState(null);

  // Sync / populate form data when modal opens or currentUser updates
  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setApiError("");
      setErrors({});
      setFormData({
        fullName: extractFullName(currentUser),
        region: currentUser?.region || currentUser?.profile?.city || REGIONS[0],
        address: currentUser?.address || currentUser?.profile?.shipping_address || "",
        phone: extractValidPhone(currentUser),
        email: currentUser?.email || "",
      });

      function handleKeyDown(e) {
        if (e.key === "Escape") {
          onClose();
        }
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, currentUser, onClose]);

  if (!isOpen) return null;

  function validateField(name, value) {
    if (name === "fullName") {
      if (!value.trim()) return "Full name is required.";
    }
    if (name === "region") {
      if (!value.trim()) return "Region / City is required.";
    }
    if (name === "address") {
      if (!value.trim()) return "Delivery address is required.";
    }
    if (name === "phone") {
      if (!value.trim()) return "Phone number is compulsory.";
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 11) {
        return "Enter a valid 10-11 digit Pakistani phone number (e.g. 03001234567).";
      }
    }
    if (name === "email" && isSignedIn) {
      if (!value.trim()) return "Email address is required.";
    }
    return "";
  }

  function handleChange(field, val) {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (apiError) setApiError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {
      fullName: validateField("fullName", formData.fullName),
      region: validateField("region", formData.region),
      address: validateField("address", formData.address),
      phone: validateField("phone", formData.phone),
    };

    if (isSignedIn) {
      newErrors.email = validateField("email", formData.email || currentUser?.email || "");
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => Boolean(err))) {
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const payload = {
        fullName: formData.fullName,
        customer_name: formData.fullName,
        region: formData.region,
        address: formData.address,
        shipping_address: formData.address,
        phone: formData.phone,
        customer_phone: formData.phone,
        email: isSignedIn ? (currentUser?.email || formData.email) : (formData.email || null),
        customer_email: isSignedIn ? (currentUser?.email || formData.email) : (formData.email || null),
        payment_method: "COD",
        items: cartItems.map((item) => ({
          product_id: item.product_id || item.id || item.productId || item._id,
          name: item.name || item.title || "",
          title: item.title || item.name || "",
          quantity: item.qty || item.quantity || 1,
          price: item.price,
          unit_price: item.price,
        })),
      };

      const result = await checkoutRequest(payload);
      setOrderResult(result);
      setStep("success");

      if (onCompleteOrder) {
        onCompleteOrder(result.order_number || result.order_id);
      }
    } catch (err) {
      console.error("Checkout submission failed:", err);
      setApiError(err.message || "Failed to place wholesale order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] bg-white rounded-[24px] shadow-2xl border border-[#E9E8E2] overflow-hidden p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "form" ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E9E8E2]">
              <div>
                <h3 className="text-[20px] font-semibold text-black">
                  {isSignedIn ? "Wholesale Checkout" : "Guest Wholesale Checkout"}
                </h3>
                <p className="text-[12px] text-[#5B5B58] mt-0.5">
                  {isSignedIn
                    ? "Signed in as " + (currentUser?.email || "Buyer")
                    : "Quick manufacturer checkout with Cash on Delivery"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5 text-[#5B5B58] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {apiError && (
              <div className="rounded-[12px] p-3 text-[13px] text-[#C6564D] bg-red-50 border border-red-200 flex items-start gap-2">
                <span className="text-[14px] mt-0.5">⚠️</span>
                <span>{apiError}</span>
              </div>
            )}

            {/* Cart Summary Banner */}
            <div className="rounded-[14px] bg-[#EEF3F2] p-3.5 text-[14px] flex justify-between items-center font-medium border border-[#E9E8E2]">
              <div>
                <span className="text-[12px] text-[#5B5B58] block">Total Amount (COD)</span>
                <span className="text-[11px] text-[#85A6A3] font-medium">
                  {cartItems.reduce((acc, curr) => acc + (curr.qty || curr.quantity || 1), 0)} items in cart
                </span>
              </div>
              <span className="text-[20px] font-bold text-black">Rs. {cartSubtotal.toLocaleString()}</span>
            </div>

            {/* Input Fields */}
            <div className="space-y-3 pt-1">
              {/* Full Name */}
              <div>
                <label className="block text-[12px] font-medium text-black mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="e.g. Muhammad Azhar"
                  className="w-full h-[42px] px-3.5 rounded-[12px] bg-white text-[13px] outline-none transition-colors"
                  style={{ border: `1px solid ${errors.fullName ? TOKENS.error : TOKENS.border}` }}
                />
                {errors.fullName && <p className="mt-1 text-[11px] text-[#C6564D]">{errors.fullName}</p>}
              </div>

              {/* Region / City & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-black mb-1">
                    Region / City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => handleChange("region", e.target.value)}
                    className="w-full h-[42px] px-3 rounded-[12px] bg-white border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]"
                  >
                    {REGIONS.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  {errors.region && <p className="mt-1 text-[11px] text-[#C6564D]">{errors.region}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-black mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full h-[42px] px-3.5 rounded-[12px] bg-white text-[13px] outline-none transition-colors"
                    style={{ border: `1px solid ${errors.phone ? TOKENS.error : TOKENS.border}` }}
                  />
                  {errors.phone && <p className="mt-1 text-[11px] text-[#C6564D]">{errors.phone}</p>}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[12px] font-medium text-black">
                    Email Address {isSignedIn ? <span className="text-red-500">*</span> : <span className="text-[#5B5B58] text-[11px] font-normal">(Optional)</span>}
                  </label>
                  {isSignedIn && (
                    <span className="text-[11px] text-[#5B5B58] flex items-center gap-1 font-medium">
                      🔒 Verified Account Email
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  disabled={isSignedIn}
                  value={isSignedIn ? (currentUser?.email || formData.email) : formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder={isSignedIn ? currentUser?.email : "buyer@example.com (optional for tracking)"}
                  className={`w-full h-[42px] px-3.5 rounded-[12px] text-[13px] outline-none transition-colors ${
                    isSignedIn
                      ? "bg-[#F5F5F0] text-[#5B5B58] border border-[#E9E8E2] cursor-not-allowed font-medium"
                      : "bg-white border border-[#E9E8E2] focus:border-[#85A6A3]"
                  }`}
                />
                {errors.email && <p className="mt-1 text-[11px] text-[#C6564D]">{errors.email}</p>}
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-[12px] font-medium text-black mb-1">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="e.g. Shop #14, Main Wholesale Market, Industrial Area"
                  className="w-full p-3 rounded-[12px] bg-white text-[13px] outline-none transition-colors resize-none"
                  style={{ border: `1px solid ${errors.address ? TOKENS.error : TOKENS.border}` }}
                />
                {errors.address && <p className="mt-1 text-[11px] text-[#C6564D]">{errors.address}</p>}
              </div>
            </div>

            {/* Payment Method Notice (Cash on Delivery Only) */}
            <div className="rounded-[14px] bg-[#EEF3F2]/70 border border-[#85A6A3]/35 p-3 text-[12px] text-[#2D4B48] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-black">
                  <span>💵</span> Cash on Delivery (COD)
                </span>
                <span className="bg-[#85A6A3]/20 text-[#1B3E3B] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#85A6A3]/30 uppercase">
                  Preselected
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#4A6461]">
                ℹ️ Only Cash on Delivery (COD) is available at this time. Pay the courier upon physical receipt and inspection.
              </p>
            </div>

            {/* Guest Sign-Up Promotion Banner (Flow B) */}
            {!isSignedIn && (
              <div className="rounded-[14px] bg-amber-50/80 border border-amber-200 p-3 text-[12px] text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-[14px]">💡</span>
                  <p className="text-[11px] leading-snug">
                    Want to track orders and checkout faster next time?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAuthModal) onOpenAuthModal("buyer");
                  }}
                  className="text-[11px] font-bold text-black underline underline-offset-2 hover:text-[#5B5B58] whitespace-nowrap cursor-pointer"
                >
                  Sign up for the best experience →
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-[16px] bg-[#A3C1BF] text-black font-semibold text-[14px] hover:bg-[#85A6A3] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  Processing Order...
                </>
              ) : (
                "Place Order via COD →"
              )}
            </button>
          </form>
        ) : (
          /* Success Screen */
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#A3C1BF] shadow-xs">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="#000" strokeWidth="2.5">
                <polyline points="4 13 9 18 20 6" />
              </svg>
            </div>

            <div>
              <h3 className="text-[22px] font-bold text-black">Order Placed Successfully!</h3>
              <p className="mt-1 text-[13px] text-[#5B5B58]">
                Wholesale Reference:{" "}
                <strong className="text-black font-bold">
                  {orderResult?.order_number || `MKT-${orderResult?.order_id?.slice(0, 6)?.toUpperCase()}`}
                </strong>
              </p>
            </div>

            {/* Order Details Card */}
            <div className="rounded-[16px] bg-[#F9F9F6] border border-[#E9E8E2] p-4 text-left text-[12px] space-y-2">
              <div className="flex justify-between pb-2 border-b border-[#E9E8E2]">
                <span className="text-[#5B5B58]">Total Amount:</span>
                <span className="font-bold text-black text-[14px]">
                  Rs. {orderResult?.total_amount?.toLocaleString() || cartSubtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B5B58]">Payment Mode:</span>
                <span className="font-semibold text-black">Cash on Delivery (COD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B5B58]">Customer:</span>
                <span className="font-semibold text-black">{orderResult?.customer_name || formData.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B5B58]">Contact Phone:</span>
                <span className="font-semibold text-black">{orderResult?.customer_phone || formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B5B58]">Delivery Address:</span>
                <span className="font-medium text-black text-right max-w-[240px] truncate">
                  {orderResult?.shipping_address || `${formData.address}, ${formData.region}`}
                </span>
              </div>
            </div>

            <p className="text-[12px] text-[#5B5B58] max-w-[360px] mx-auto leading-relaxed">
              We have dispatched your purchase order to our verified manufacturing network. You will receive dispatch and shipment tracking updates via phone.
            </p>

            <button
              onClick={onClose}
              className="mt-2 w-full h-[46px] rounded-[16px] bg-black text-white font-medium text-[14px] hover:bg-black/90 transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
