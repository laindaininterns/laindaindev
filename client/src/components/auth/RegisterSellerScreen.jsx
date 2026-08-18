import React, { useState, useRef, useEffect } from "react";
import {
  TOKENS,
  CATEGORIES,
  validateEmail,
  validatePhone,
  validateRequired,
  mockRegisterSellerRequest,
} from "../../data/marketplaceData";
import { registerSellerRequest, verifyEmailRequest, resendOtpRequest } from "../../services/api";
import posthog, { isPostHogEnabled } from "../../posthog";

export default function RegisterSellerScreen({ onRegisterSuccess, onSwitchScreen }) {
  // Steps: 1: Business details, 2: Proof & Docs, 3: 6-Digit OTP Verification, 4: Application Submitted
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bizName: "",
    category: CATEGORIES[1] || "Clothing & Apparel",
    email: "",
    bizPhone: "",
    city: "Faisalabad",
    password: "",
    confirmPassword: "",
    ntnNumber: "",
    proofFile: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultRef, setResultRef] = useState("");
  const [registeredUser, setRegisteredUser] = useState(null);

  // OTP State (6 separate box digits)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef([]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when reaching step 3
  useEffect(() => {
    if (step === 3) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  function handleChange(field, value) {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
    if (field === "password" || field === "confirmPassword") {
      if (errors.password || errors.confirmPassword) {
        setErrors((e) => ({ ...e, password: "", confirmPassword: "" }));
      }
    }
    if (formError) setFormError("");
  }

  function validateStep1() {
    const newErrors = {
      bizName: validateRequired(formData.bizName, "Business Name"),
      email: validateEmail(formData.email),
      bizPhone: validatePhone(formData.bizPhone),
    };

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required.";
    } else if (formData.password && formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((err) => Boolean(err));
  }

  function handleNextStep(e) {
    e.preventDefault();
    if (!validateStep1()) return;
    setStep(2);
  }

  async function handleFinalSubmit(e) {
    e.preventDefault();
    if (!formData.ntnNumber.trim()) {
      setErrors({ ntnNumber: "Enter your NTN or CNIC for seller verification." });
      return;
    }

    if (!formData.password || formData.password.length < 6 || formData.password !== formData.confirmPassword) {
      setFormError("Please ensure password is at least 6 characters and matches confirmation.");
      setStep(1);
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      let res;
      try {
        res = await registerSellerRequest(formData);
      } catch (apiErr) {
        console.warn("Seller API registration failed, using fallback:", apiErr.message);
        if (apiErr.message.includes("Failed to fetch") || apiErr.message.includes("NetworkError")) {
          res = await mockRegisterSellerRequest(formData);
        } else {
          throw apiErr;
        }
      }

      if (isPostHogEnabled) {
        posthog.capture("seller_application_submitted", {
          category: formData.category,
          has_business_proof: Boolean(formData.proofFile),
        });
      }

      setResultRef(res.refId || `SUP-${Math.floor(100000 + Math.random() * 900000)}`);
      setRegisteredUser(res);
      // Transition to 6-Digit OTP Verification step
      setStep(3);
      setResendCooldown(30); // 30 second cooldown for initial OTP
    } catch (ex) {
      setFormError(ex.message || "Failed to submit seller application.");
    } finally {
      setLoading(false);
    }
  }

  // Handle individual OTP digit change
  function handleOtpChange(index, value) {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = cleanVal ? cleanVal.slice(-1) : "";
    setOtp(newOtp);
    if (formError) setFormError("");

    // Auto-advance to next box if digit was entered
    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  // Handle OTP backspace navigation
  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  // Handle pasting full 6-digit code
  function handleOtpPaste(e) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || "";
    }
    setOtp(newOtp);
    if (formError) setFormError("");

    const focusIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  }

  // Execute OTP Verification
  async function handleVerifyOtp(e) {
    if (e) e.preventDefault();
    const fullCode = otp.join("").trim();

    if (fullCode.length !== 6) {
      setFormError("Please enter the complete 6-digit OTP verification code.");
      return;
    }

    setOtpLoading(true);
    setFormError("");

    try {
      await verifyEmailRequest({
        email: formData.email,
        code: fullCode,
        otp: fullCode,
      });

      if (isPostHogEnabled) {
        posthog.capture("seller_otp_verified", {
          email: formData.email,
          business_name: formData.bizName,
        });
      }

      // Transition to "Application Submitted!" confirmation screen
      setStep(4);
    } catch (err) {
      setFormError(err.message || "Invalid verification code. Please check and try again.");
    } finally {
      setOtpLoading(false);
    }
  }

  // Handle Resend OTP Code
  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setFormError("");
    setFormSuccess("");

    try {
      await resendOtpRequest(formData.email);
      setFormSuccess("A fresh 6-digit code has been dispatched to your email.");
      setResendCooldown(30);
      setTimeout(() => setFormSuccess(""), 4000);
    } catch (err) {
      setFormError(err.message || "Failed to resend verification code. Please try again.");
    }
  }

  // Finish and redirect to Marketplace
  function handleFinishToMarketplace() {
    onRegisterSuccess({
      ...registeredUser,
      name: registeredUser?.name || formData.bizName,
      email: registeredUser?.email || formData.email,
      role: "SELLER",
      pendingApproval: true,
    });
  }

  return (
    <div>
      {/* Top Header */}
      <div className="text-center mb-4">
        <h2 className="text-[20px] font-semibold text-black">Apply as Verified Supplier</h2>
        <p className="mt-0.5 text-[12px] text-[#5B5B58]">Join Pakistan's premier B2B manufacturer network.</p>

        {/* Step Indicator (Steps 1, 2, 3) */}
        {step < 4 && (
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
            <span
              className={`h-2 rounded-full transition-all ${
                step === 3 ? "w-8 bg-[#85A6A3]" : "w-2 bg-[#E9E8E2]"
              }`}
            />
          </div>
        )}
      </div>

      {formError && (
        <div className="mb-4 rounded-[12px] p-3 text-[13px] text-[#C6564D] bg-red-50 border border-red-200 flex items-start gap-2">
          <span className="text-[14px] mt-0.5 flex-shrink-0">⚠️</span>
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div className="mb-4 rounded-[12px] p-3 text-[13px] text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-start gap-2">
          <span className="text-[14px] mt-0.5 flex-shrink-0">✓</span>
          <span>{formSuccess}</span>
        </div>
      )}

      {/* STEP 1: Business Details & Password Form */}
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

          {/* Password and Confirm Password Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-black mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Enter secure password"
                  className="h-[42px] w-full rounded-[14px] bg-white pl-3.5 pr-10 text-[13px] outline-none"
                  style={{ border: `1px solid ${errors.password ? TOKENS.error : TOKENS.border}` }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5B5B58] hover:text-black flex items-center justify-center p-1 rounded"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[12px] text-[#C6564D]">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-medium text-black mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="Confirm password"
                  className="h-[42px] w-full rounded-[14px] bg-white pl-3.5 pr-10 text-[13px] outline-none"
                  style={{ border: `1px solid ${errors.confirmPassword ? TOKENS.error : TOKENS.border}` }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5B5B58] hover:text-black flex items-center justify-center p-1 rounded"
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-[12px] text-[#C6564D]">{errors.confirmPassword}</p>}
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 flex h-[44px] w-full items-center justify-center rounded-[14px] text-[14px] font-medium text-black transition-all active:scale-[0.98] cursor-pointer"
            style={{ background: TOKENS.sage }}
          >
            Continue to Verification (Step 2/3) →
          </button>
        </form>
      )}

      {/* STEP 2: Proof & Tax Details */}
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
              className="w-1/3 h-[44px] rounded-[14px] border border-black bg-transparent text-[13px] font-medium text-black hover:bg-black/5 transition-colors cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-[44px] rounded-[14px] text-[14px] font-medium text-black transition-all active:scale-[0.98] cursor-pointer"
              style={{ background: loading ? TOKENS.border : TOKENS.sage }}
            >
              {loading ? "Submitting Application..." : "Submit Application →"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: 6-Digit OTP Verification */}
      {step === 3 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
          <div className="text-center space-y-1">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF3F2] border border-[#A3C1BF]/30 mb-2">
              <span className="text-[20px]">✉️</span>
            </div>
            <h3 className="text-[17px] font-semibold text-black">Verify Your Email</h3>
            <p className="text-[12px] text-[#5B5B58] max-w-[320px] mx-auto leading-relaxed">
              Enter the 6-digit verification code sent to <br />
              <strong className="text-black font-semibold">{formData.email}</strong>
            </p>
          </div>

          {/* 6-box OTP Input Grid */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-4" onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="w-11 h-12 text-center text-[19px] font-bold text-black rounded-[12px] bg-white border border-[#E9E8E2] focus:border-[#85A6A3] focus:ring-2 focus:ring-[#85A6A3]/25 outline-none transition-all shadow-xs"
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={otpLoading || otp.join("").length < 6}
            className="h-[44px] w-full rounded-[14px] text-[14px] font-medium text-black transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer"
            style={{
              background: otp.join("").length === 6 && !otpLoading ? TOKENS.sage : TOKENS.border,
              color: otp.join("").length === 6 && !otpLoading ? TOKENS.black : TOKENS.textMuted,
              cursor: otp.join("").length === 6 && !otpLoading ? "pointer" : "not-allowed",
            }}
          >
            {otpLoading ? "Verifying Code..." : "Verify Code →"}
          </button>

          {/* Resend Code & Back actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[#5B5B58] hover:text-black transition-colors cursor-pointer"
            >
              ← Edit Details / Email
            </button>

            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleResendOtp}
              className={`font-medium ${
                resendCooldown > 0
                  ? "text-[#8E8E8A] cursor-not-allowed"
                  : "text-black underline underline-offset-2 hover:text-[#5B5B58] cursor-pointer"
              }`}
            >
              {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : "Resend Code"}
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Application Submitted Confirmation (Exact Reference Screen) */}
      {step === 4 && (
        <div className="text-center py-2 space-y-3">
          {/* Center green checkmark icon inside circular badge */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#A3C1BF] shadow-xs">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#000" strokeWidth="2.5">
              <polyline points="4 13 9 18 20 6" />
            </svg>
          </div>

          <h3 className="text-[20px] font-semibold text-black">Application Submitted!</h3>
          <p className="text-[13px] text-[#5B5B58]">
            Application Reference ID: <strong className="text-black font-semibold">{resultRef}</strong>
          </p>

          {/* Amber Warning Card */}
          <div className="my-3 p-3.5 rounded-[14px] bg-amber-50 border border-amber-200 text-[12px] text-amber-900 text-left space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-amber-950">
              <span>⏳ Account Pending Admin Review</span>
            </p>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Your seller application is under review by our verification team. You cannot manage products or open the vendor portal until approved. You will receive an email notification as soon as your account is activated.
            </p>
          </div>

          {/* Black Primary Button */}
          <button
            onClick={handleFinishToMarketplace}
            className="mt-4 h-[44px] w-full rounded-[14px] bg-black text-white font-medium text-[13px] hover:bg-black/90 transition-all active:scale-[0.98] cursor-pointer"
          >
            Continue to Marketplace →
          </button>

          {/* Footer Skip Link */}
          <div className="pt-2 text-center">
            <button
              onClick={handleFinishToMarketplace}
              className="text-[12px] text-[#5B5B58] underline underline-offset-2 hover:text-black cursor-pointer"
            >
              Want to explore first? Continue as Guest (Skip) →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
