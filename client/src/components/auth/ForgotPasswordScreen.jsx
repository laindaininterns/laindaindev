import React, { useState } from "react";
import { TOKENS, validateEmail, mockForgotRequest } from "../../data/marketplaceData";
import { requestPasswordReset } from "../../services/api";

export default function ForgotPasswordScreen({ onSwitchScreen }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateEmail(email);
    setError(err);
    if (err) return;

    setLoading(true);
    setFormError("");

    try {
      try {
        await requestPasswordReset(email);
      } catch (apiErr) {
        console.warn("API forgot-password failed or offline, using fallback:", apiErr.message);
        if (apiErr.message.includes("Failed to fetch") || apiErr.message.includes("NetworkError")) {
          await mockForgotRequest(email);
        } else {
          throw apiErr;
        }
      }
      setSent(true);
    } catch (ex) {
      setFormError(ex.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-[20px] font-semibold text-black">Forgot Password</h2>
        <p className="mt-1 text-[13px] text-[#5B5B58]">
          Enter your registered email address to receive password reset instructions.
        </p>
      </div>

      {formError && (
        <div className="mb-4 rounded-[12px] p-3 text-[13px] text-[#C6564D] bg-red-50 border border-red-200">
          {formError}
        </div>
      )}

      {sent ? (
        <div className="text-center py-4 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#A3C1BF]">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#000" strokeWidth="2">
              <polyline points="4 13 9 18 20 6" />
            </svg>
          </div>
          <h3 className="text-[16px] font-semibold text-black">Reset Link Sent!</h3>
          <p className="text-[13px] text-[#5B5B58]">
            We have sent password reset instructions to <strong>{email}</strong>.
          </p>
          <button
            onClick={() => onSwitchScreen("login")}
            className="mt-2 text-[13px] font-semibold text-black underline"
          >
            Back to Log in →
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-black">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(validateEmail(e.target.value));
              }}
              placeholder="you@company.com"
              className="h-[44px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none"
              style={{ border: `1px solid ${error ? TOKENS.error : TOKENS.border}` }}
            />
            {error && <p className="mt-1 text-[12px] text-[#C6564D]">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-[44px] w-full items-center justify-center rounded-[14px] text-[14px] font-medium text-black transition-all active:scale-[0.98]"
            style={{ background: TOKENS.sage }}
          >
            {loading ? "Sending..." : "Send Reset Instructions →"}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => onSwitchScreen("login")}
              className="text-[13px] font-medium text-[#5B5B58] hover:text-black"
            >
              ← Back to Log in
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
