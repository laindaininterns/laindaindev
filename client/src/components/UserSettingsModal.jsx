import React, { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "../services/api";

export default function UserSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    businessName: "",
    contactNumber: "",
    billingAddress: "",
    shippingAddress: "",
    address: "",
    taxId: "",
  });

  const [userRole, setUserRole] = useState("BUYER");

  // Keyboard escape listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch current user profile when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    getUserProfile()
      .then((data) => {
        if (data && data.success) {
          const u = data.user || {};
          const p = data.profile || {};
          const role = u.role || currentUser?.role || "BUYER";
          setUserRole(role);

          const emailPrefix = u.email ? u.email.split('@')[0] : (currentUser?.email ? currentUser.email.split('@')[0] : "");
          const rawName = p.full_name || (currentUser?.name && currentUser.name !== emailPrefix ? currentUser.name : "");

          setFormData({
            email: u.email || currentUser?.email || "",
            fullName: rawName,
            businessName: p.business_name || currentUser?.bizName || "",
            contactNumber: p.contact_number || "",
            billingAddress: p.billing_address || "",
            shippingAddress: p.shipping_address || "",
            address: p.business_address || "",
            taxId: p.tax_id || "",
          });
        }
      })
      .catch(() => {
        // Fallback to current user state if server profile endpoint is unreachable or offline
        const role = currentUser?.role || "BUYER";
        const emailPrefix = currentUser?.email ? currentUser.email.split('@')[0] : "";
        const rawName = currentUser?.name && currentUser.name !== emailPrefix ? currentUser.name : "";

        setUserRole(role);
        setFormData((prev) => ({
          ...prev,
          email: currentUser?.email || "",
          fullName: rawName,
          businessName: currentUser?.bizName || "",
        }));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);

    try {
      const payload = {
        email: formData.email,
      };

      if (userRole === "SELLER") {
        payload.business_name = formData.businessName;
        payload.contact_number = formData.contactNumber;
        payload.business_address = formData.address;
        payload.tax_id = formData.taxId;
      } else {
        payload.full_name = formData.fullName;
        payload.contact_number = formData.contactNumber;
        payload.billing_address = formData.billingAddress;
        payload.shipping_address = formData.shippingAddress;
      }

      const res = await updateUserProfile(payload);
      if (res && res.success) {
        setSuccessMsg("Profile updated successfully!");
        const updatedName =
          res.displayName ||
          res.profile?.full_name ||
          res.profile?.business_name ||
          (userRole === "SELLER" ? formData.businessName : formData.fullName) ||
          res.user?.email;

        if (onProfileUpdated) {
          onProfileUpdated({
            name: updatedName,
            email: res.user?.email || formData.email,
            role: res.user?.role || userRole,
            profile: res.profile,
          });
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] max-h-[92vh] bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col border border-[#E9E8E2] transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 bg-[#F9F9F6] border-b border-[#E9E8E2]">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-semibold text-black tracking-tight">Account Settings</h2>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[#EEF3F2] text-[#3D5A58] border border-[#E9E8E2] uppercase tracking-wider">
              {userRole}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white text-[#5B5B58] border border-[#E9E8E2] hover:bg-black/5 hover:text-black transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="rounded-[14px] bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-[14px] bg-emerald-50 border border-emerald-200 p-3 text-[13px] text-emerald-800">
              ✅ {successMsg}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-[#5B5B58] text-[14px]">
              <div className="h-6 w-6 border-2 border-[#A3C1BF] border-t-transparent rounded-full animate-spin mb-2"></div>
              Loading profile details...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-[12px] font-semibold text-[#5B5B58] uppercase tracking-wider mb-1">
                  {userRole === "SELLER" ? "Business Name" : "Full Name"}
                </label>
                <input
                  type="text"
                  name={userRole === "SELLER" ? "businessName" : "fullName"}
                  value={userRole === "SELLER" ? formData.businessName : formData.fullName}
                  onChange={handleChange}
                  placeholder={userRole === "SELLER" ? "e.g. Lahore Garments Direct" : "e.g. Ali Raza"}
                  required
                  className="w-full h-[42px] px-3.5 rounded-[14px] border border-[#E9E8E2] bg-[#F9F9F6] text-[14px] text-black focus:bg-white focus:border-black focus:outline-none transition-colors"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[12px] font-semibold text-[#5B5B58] uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="yourname@domain.com"
                  required
                  className="w-full h-[42px] px-3.5 rounded-[14px] border border-[#E9E8E2] bg-[#F9F9F6] text-[14px] text-black focus:bg-white focus:border-black focus:outline-none transition-colors"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-[12px] font-semibold text-[#5B5B58] uppercase tracking-wider mb-1">
                  Phone / Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="0300-1234567"
                  className="w-full h-[42px] px-3.5 rounded-[14px] border border-[#E9E8E2] bg-[#F9F9F6] text-[14px] text-black focus:bg-white focus:border-black focus:outline-none transition-colors"
                />
              </div>

              {/* BUYER Fields: Billing Address & Shipping Address */}
              {userRole === "BUYER" ? (
                <>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#5B5B58] uppercase tracking-wider mb-1">
                      Billing Address
                    </label>
                    <input
                      type="text"
                      name="billingAddress"
                      value={formData.billingAddress}
                      onChange={handleChange}
                      placeholder="e.g. House 45, Block B, Gulberg III, Lahore"
                      className="w-full h-[42px] px-3.5 rounded-[14px] border border-[#E9E8E2] bg-[#F9F9F6] text-[14px] text-black focus:bg-white focus:border-black focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#5B5B58] uppercase tracking-wider mb-1">
                      Shipping Address
                    </label>
                    <input
                      type="text"
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleChange}
                      placeholder="e.g. Warehouse 12, Raiwind Road, Lahore"
                      className="w-full h-[42px] px-3.5 rounded-[14px] border border-[#E9E8E2] bg-[#F9F9F6] text-[14px] text-black focus:bg-white focus:border-black focus:outline-none transition-colors"
                    />
                  </div>
                </>
              ) : (
                /* SELLER Fields: Business Address & Tax ID */
                <>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#5B5B58] uppercase tracking-wider mb-1">
                      Business Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. Shop 12, Anarkali Bazaar, Lahore"
                      className="w-full h-[42px] px-3.5 rounded-[14px] border border-[#E9E8E2] bg-[#F9F9F6] text-[14px] text-black focus:bg-white focus:border-black focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#5B5B58] uppercase tracking-wider mb-1">
                      Tax ID / NTN Number
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleChange}
                      placeholder="e.g. 1234567-8"
                      className="w-full h-[42px] px-3.5 rounded-[14px] border border-[#E9E8E2] bg-[#F9F9F6] text-[14px] text-black focus:bg-white focus:border-black focus:outline-none transition-colors"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-[42px] px-5 rounded-[16px] text-[14px] font-medium text-[#5B5B58] hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-[42px] px-6 rounded-[16px] text-[14px] font-semibold text-black bg-[#A3C1BF] hover:bg-[#85A6A3] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
