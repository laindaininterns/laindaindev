import React, { useState } from "react";
import { TOKENS } from "../../data/marketplaceData";
import { resetPasswordRequest } from "../../services/api";

export default function ResetPasswordScreen({ onNavigateLogin }) {
  // Extract reset token from URL query params: ?token=...
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) {
      setError("Missing or invalid password reset link token. Please check your email link.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPasswordRequest({ token, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F9F9F6]">
      <div className="w-full max-w-[460px] bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-7 border border-[#E9E8E2]">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1A56DB]/10 mb-3">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#1A56DB" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-[22px] font-semibold text-black">Reset Your Password</h2>
          <p className="mt-1 text-[13px] text-[#5B5B58]">
            Set a new secure password for your LainDain account.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-[12px] p-3 text-[13px] text-[#C6564D] bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#059669" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-[18px] font-semibold text-black">Password Reset Complete!</h3>
            <p className="text-[13px] text-[#5B5B58]">
              Your password has been updated successfully. You can now log in using your new password.
            </p>
            <button
              onClick={onNavigateLogin}
              className="mt-4 flex h-[44px] w-full items-center justify-center rounded-[14px] text-[14px] font-medium text-black transition-all active:scale-[0.98]"
              style={{ background: TOKENS.sage }}
            >
              Continue to Log In →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {!token && (
              <div className="rounded-[12px] p-3 text-[13px] text-[#C6564D] bg-amber-50 border border-amber-200 mb-2">
                ⚠️ Warning: No reset token detected in URL. Make sure you opened the full link from your reset email.
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-black mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-[44px] w-full rounded-[14px] bg-white px-3.5 pr-11 text-[13px] outline-none"
                  style={{ border: `1px solid ${TOKENS.border}` }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#5B5B58] hover:text-black"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-black mb-1.5">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="h-[44px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none"
                style={{ border: `1px solid ${TOKENS.border}` }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="flex h-[44px] w-full items-center justify-center rounded-[14px] text-[14px] font-medium text-black transition-all active:scale-[0.98]"
              style={{
                background: loading || !token ? TOKENS.border : TOKENS.sage,
                cursor: loading || !token ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Updating Password..." : "Reset Password →"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="text-[13px] font-medium text-[#5B5B58] hover:text-black underline"
              >
                ← Return to Log In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
