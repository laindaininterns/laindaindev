import React, { useState } from "react";
import {
  TOKENS,
  validateEmail,
  validatePassword,
  validateRequired,
  mockRegisterBuyerRequest,
} from "../../data/marketplaceData";
import { registerBuyerRequest } from "../../services/api";

export default function RegisterBuyerScreen({ onSwitchScreen, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    bizName: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(field, value) {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
    if (formError) setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {
      fullName: validateRequired(formData.fullName, "Full Name"),
      bizName: validateRequired(formData.bizName, "Business Name"),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some((err) => err)) return;

    setLoading(true);
    setFormError("");

    try {
      let user;
      try {
        user = await registerBuyerRequest(formData);
      } catch (apiErr) {
        // Fallback to mock if API server is offline/unreachable
        console.warn("API registration failed or offline, using fallback:", apiErr.message);
        if (apiErr.message.includes("Failed to fetch") || apiErr.message.includes("NetworkError")) {
          user = await mockRegisterBuyerRequest(formData);
        } else {
          throw apiErr;
        }
      }
      onRegisterSuccess(user);
    } catch (ex) {
      setFormError(ex.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-[20px] font-semibold text-black">Register as Wholesale Buyer</h2>
        <p className="mt-1 text-[13px] text-[#5B5B58]">Source directly from verified manufacturers.</p>
      </div>

      {formError && (
        <div className="mb-4 rounded-[12px] p-3 text-[13px] text-[#C6564D] bg-red-50 border border-red-200">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-black mb-1">Full Name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="e.g. Tariq Mehmood"
            className="h-[42px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none"
            style={{ border: `1px solid ${errors.fullName ? TOKENS.error : TOKENS.border}` }}
          />
          {errors.fullName && <p className="mt-1 text-[12px] text-[#C6564D]">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-[12px] font-medium text-black mb-1">Business / Shop Name</label>
          <input
            type="text"
            value={formData.bizName}
            onChange={(e) => handleChange("bizName", e.target.value)}
            placeholder="e.g. Mehmood Garments Store"
            className="h-[42px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none"
            style={{ border: `1px solid ${errors.bizName ? TOKENS.error : TOKENS.border}` }}
          />
          {errors.bizName && <p className="mt-1 text-[12px] text-[#C6564D]">{errors.bizName}</p>}
        </div>

        <div>
          <label className="block text-[12px] font-medium text-black mb-1">Work Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="buyer@company.com"
            className="h-[42px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none"
            style={{ border: `1px solid ${errors.email ? TOKENS.error : TOKENS.border}` }}
          />
          {errors.email && <p className="mt-1 text-[12px] text-[#C6564D]">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-[12px] font-medium text-black mb-1">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="At least 6 characters"
            className="h-[42px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none"
            style={{ border: `1px solid ${errors.password ? TOKENS.error : TOKENS.border}` }}
          />
          {errors.password && <p className="mt-1 text-[12px] text-[#C6564D]">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex h-[44px] w-full items-center justify-center rounded-[14px] text-[14px] font-medium text-black transition-all active:scale-[0.98]"
          style={{ background: TOKENS.sage }}
        >
          {loading ? "Creating Account..." : "Create Buyer Account →"}
        </button>

        <p className="text-center text-[12px] text-[#5B5B58] mt-3">
          Already registered?{" "}
          <button
            type="button"
            onClick={() => onSwitchScreen("login")}
            className="font-medium text-black underline"
          >
            Sign in here
          </button>
        </p>
      </form>
    </div>
  );
}
