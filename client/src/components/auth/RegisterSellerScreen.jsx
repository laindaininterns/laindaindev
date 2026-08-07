import React, { useState } from "react";
import {
  TOKENS,
  CATEGORIES,
  validateEmail,
  validatePhone,
  validateRequired,
  mockRegisterSellerRequest,
} from "../../data/marketplaceData";

export default function RegisterSellerScreen({ _onSwitchScreen, onRegisterSuccess }) {
  const [step, setStep] = useState(1); // 1: Business details, 2: Proof & Docs, 3: Success
  const [formData, setFormData] = useState({
    bizName: "",
    category: CATEGORIES[1],
    email: "",
    bizPhone: "",
    city: "Faisalabad",
    ntnNumber: "",
    proofFile: null,
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultRef, setResultRef] = useState("");

  function handleChange(field, value) {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
    if (formError) setFormError("");
  }

  function handleNextStep(e) {
    e.preventDefault();
    const newErrors = {
      bizName: validateRequired(formData.bizName, "Business Name"),
      email: validateEmail(formData.email),
      bizPhone: validatePhone(formData.bizPhone),
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some((err) => err)) return;

    setStep(2);
  }

  async function handleFinalSubmit(e) {
    e.preventDefault();
    if (!formData.ntnNumber.trim()) {
      setErrors({ ntnNumber: "Enter your NTN or CNIC for seller verification." });
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      const res = await mockRegisterSellerRequest(formData);
      setResultRef(res.refId);
      setStep(3);
    } catch (ex) {
      setFormError(ex.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header Stepper */}
      <div className="text-center mb-4">
        <h2 className="text-[20px] font-semibold text-black">Apply as Verified Supplier</h2>
        <p className="mt-0.5 text-[12px] text-[#5B5B58]">Join Pakistan's premier B2B manufacturer network.</p>

        {/* Step Indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <span
              className={`h-2 rounded-full transition-all ${
                step === 1 ? "w-8 bg-[#85A6A3]" : "w-2 bg-[#E9E8E2]"
              }`}
            />
            <span
              className={`h-2 rounded-full transition-all ${
                step === 2 ? "w-8 bg-[#85A6A3]" : "w-2 bg-[#E9E8E2]"
              }`}
            />
          </div>
        )}
      </div>

      {formError && (
        <div className="mb-4 rounded-[12px] p-3 text-[13px] text-[#C6564D] bg-red-50 border border-red-200">
          {formError}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleNextStep} noValidate className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-black mb-1">Company / Factory Name</label>
            <input
              type="text"
              value={formData.bizName}
              onChange={(e) => handleChange("bizName", e.target.value)}
              placeholder="e.g. Faisalabad Textile Mills Ltd."
              className="h-[42px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none"
              style={{ border: `1px solid ${errors.bizName ? TOKENS.error : TOKENS.border}` }}
            />
            {errors.bizName && <p className="mt-1 text-[12px] text-[#C6564D]">{errors.bizName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-black mb-1">Main Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="h-[42px] w-full rounded-[14px] bg-white px-3 text-[13px] outline-none border border-[#E9E8E2]"
              >
                {CATEGORIES.slice(1).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-black mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="City"
                className="h-[42px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none border border-[#E9E8E2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-black mb-1">Business Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="sales@factory.com"
              className="h-[42px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none"
              style={{ border: `1px solid ${errors.email ? TOKENS.error : TOKENS.border}` }}
            />
            {errors.email && <p className="mt-1 text-[12px] text-[#C6564D]">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-medium text-black mb-1">Business Phone Number</label>
            <input
              type="tel"
              value={formData.bizPhone}
              onChange={(e) => handleChange("bizPhone", e.target.value)}
              placeholder="0300 1234567"
              className="h-[42px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none"
              style={{ border: `1px solid ${errors.bizPhone ? TOKENS.error : TOKENS.border}` }}
            />
            {errors.bizPhone && <p className="mt-1 text-[12px] text-[#C6564D]">{errors.bizPhone}</p>}
          </div>

          <button
            type="submit"
            className="mt-4 flex h-[44px] w-full items-center justify-center rounded-[14px] text-[14px] font-medium text-black transition-all active:scale-[0.98]"
            style={{ background: TOKENS.sage }}
          >
            Continue to Verification (Step 2/2) →
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleFinalSubmit} noValidate className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-black mb-1">NTN or CNIC Number</label>
            <input
              type="text"
              value={formData.ntnNumber}
              onChange={(e) => handleChange("ntnNumber", e.target.value)}
              placeholder="e.g. 1234567-8 or 35202-XXXXXXX-X"
              className="h-[42px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none"
              style={{ border: `1px solid ${errors.ntnNumber ? TOKENS.error : TOKENS.border}` }}
            />
            {errors.ntnNumber && <p className="mt-1 text-[12px] text-[#C6564D]">{errors.ntnNumber}</p>}
          </div>

          <div>
            <label className="block text-[12px] font-medium text-black mb-1">Proof of Business (Optional)</label>
            <div className="border-2 border-dashed border-[#E9E8E2] rounded-[14px] p-4 text-center bg-white hover:border-[#85A6A3] transition-colors cursor-pointer relative">
              <input
                type="file"
                onChange={(e) => handleChange("proofFile", e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="block text-[22px] mb-1">📄</span>
              <span className="block text-[13px] font-medium text-black">
                {formData.proofFile ? formData.proofFile.name : "Upload Tax Certificate or Visiting Card"}
              </span>
              <span className="block text-[11px] text-[#5B5B58]">PDF, PNG, or JPG (max 10MB)</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 h-[44px] rounded-[14px] border border-black bg-transparent text-[13px] font-medium text-black"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-[44px] rounded-[14px] text-[14px] font-medium text-black transition-all active:scale-[0.98]"
              style={{ background: TOKENS.sage }}
            >
              {loading ? "Submitting Application..." : "Submit Application →"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-4 space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#A3C1BF]">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#000" strokeWidth="2.5">
              <polyline points="4 13 9 18 20 6" />
            </svg>
          </div>
          <h3 className="text-[20px] font-semibold text-black">Application Submitted!</h3>
          <p className="text-[13px] text-[#5B5B58]">
            Application Reference ID: <strong className="text-black">{resultRef}</strong>
          </p>
          <p className="text-[12px] text-[#5B5B58] max-w-[320px] mx-auto">
            Our verification team will review your business credentials within 24 hours.
          </p>
          <button
            onClick={() => onRegisterSuccess({ name: formData.bizName, email: formData.email })}
            className="mt-4 h-[44px] px-6 rounded-[14px] bg-black text-white font-medium text-[13px]"
          >
            Enter Marketplace →
          </button>
        </div>
      )}
    </div>
  );
}
