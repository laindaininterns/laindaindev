import React, { useState, useRef } from "react";
import {
  TOKENS,
  validateEmail,
  validatePassword,
  mockLoginRequest,
} from "../../data/marketplaceData";

function Hint({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] font-normal leading-tight text-[#C6564D]">{message}</p>;
}

function AlertBox({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2.5 rounded-[12px] px-3.5 py-2.5 text-[13px] leading-relaxed"
      style={{
        color: "#C6564D",
        background: "rgba(198, 86, 77, 0.06)",
        border: "1px solid rgba(198, 86, 77, 0.3)",
      }}
    >
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] flex-shrink-0 mt-0.5" fill="none" stroke="#C6564D" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>{message}</div>
    </div>
  );
}

export default function LoginScreen({ onSwitchScreen, onLoginSuccess }) {
  const [email, setEmail] = useState("demo@laindain.pk");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  function handleBlur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
    if (field === "email") setErrors((e) => ({ ...e, email: validateEmail(email) }));
    if (field === "password") setErrors((e) => ({ ...e, password: validatePassword(password) }));
  }

  function handleChange(field, value) {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (touched[field]) {
      setErrors((e) => ({
        ...e,
        [field]: field === "email" ? validateEmail(value) : validatePassword(value),
      }));
    }
    if (formError) setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setErrors({ email: emailErr, password: passwordErr });
    setTouched({ email: true, password: true });

    if (emailErr) {
      emailRef.current?.focus();
      return;
    }
    if (passwordErr) {
      passwordRef.current?.focus();
      return;
    }

    setStatus("loading");
    setFormError("");

    try {
      const user = await mockLoginRequest(email, password);
      setStatus("success");
      onLoginSuccess(user);
    } catch (err) {
      setStatus("idle");
      setFormError(err.message || "Failed to log in.");
    }
  }

  return (
    <div>
      <div className="text-center mb-5">
        <h2 className="text-[20px] font-semibold text-black">Log in to LainDain</h2>
        <p className="mt-1 text-[13px] text-[#5B5B58]">Enter your business credentials below.</p>
      </div>

      <AlertBox message={formError} />

      <form onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="mb-4">
          <label htmlFor="login-email" className="mb-1.5 block text-[12px] font-medium text-black">Email Address</label>
          <input
            id="login-email"
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="you@company.com"
            className="h-[44px] w-full rounded-[14px] bg-white px-3.5 text-[13px] outline-none transition-all"
            style={{
              border: `1px solid ${errors.email ? TOKENS.error : TOKENS.border}`,
            }}
          />
          <Hint message={errors.email} />
        </div>

        {/* Password Field */}
        <div className="mb-3">
          <label htmlFor="login-password" className="mb-1.5 block text-[12px] font-medium text-black">Password</label>
          <div className="relative">
            <input
              id="login-password"
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder="••••••••"
              className="h-[44px] w-full rounded-[14px] bg-white pl-3.5 pr-11 text-[13px] outline-none transition-all"
              style={{
                border: `1px solid ${errors.password ? TOKENS.error : TOKENS.border}`,
              }}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[8px] hover:bg-black/5"
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="#000" strokeWidth="1.7">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.4 5.5A9.6 9.6 0 0 1 12 5c5 0 9 4.5 10 7-.4 1.1-1.2 2.5-2.3 3.7M6.3 6.3C4.4 7.6 3 9.4 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="#000" strokeWidth="1.7">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <Hint message={errors.password} />
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="mb-5 flex items-center justify-between text-[12px]">
          <label className="flex items-center gap-2 cursor-pointer text-[#5B5B58]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded"
              style={{ accentColor: TOKENS.sageDark }}
            />
            <span>Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => onSwitchScreen("forgot_password")}
            className="font-medium text-black underline underline-offset-2 hover:text-[#5B5B58]"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex h-[44px] w-full items-center justify-center rounded-[14px] text-[14px] font-medium transition-all active:scale-[0.98]"
          style={{
            background: status === "loading" ? TOKENS.border : TOKENS.sage,
            color: status === "loading" ? TOKENS.textMuted : TOKENS.black,
            cursor: status === "loading" ? "not-allowed" : "pointer",
          }}
        >
          {status === "loading" ? "Logging in…" : "Log In →"}
        </button>
      </form>
    </div>
  );
}
