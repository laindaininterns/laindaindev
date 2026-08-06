import { useState, useRef } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(v) {
  if (!v.trim()) return "Enter your email address to continue.";
  if (!EMAIL_RE.test(v.trim())) return "Enter a valid email address, e.g. you@company.com.";
  return "";
}
function validatePassword(v) {
  if (!v) return "Enter your password to continue.";
  if (v.length < 6) return "Password must be at least 6 characters.";
  return "";
}
// Mock auth — use password "wrongpass" to preview the error state.
function loginRequest(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (password === "wrongpass") reject(new Error("Incorrect email or password. Please try again."));
      else resolve({ name: email.split("@")[0] });
    }, 900);
  });
}

function Hint({ message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] text-[#C6564D]">{message}</p>;
}

export default function Land10LoginPreview() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");
  const [toast, setToast] = useState({ show: false, message: "", tone: "success" });

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const toastTimer = useRef(null);

  function fireToast(message, tone = "success") {
    setToast({ show: true, message, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2400);
  }

  function handleBlur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
    if (field === "email") setErrors((e) => ({ ...e, email: validateEmail(email) }));
    if (field === "password") setErrors((e) => ({ ...e, password: validatePassword(password) }));
  }

  function handleChange(field, value) {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (touched[field]) {
      setErrors((e) => ({ ...e, [field]: field === "email" ? validateEmail(value) : validatePassword(value) }));
    }
    if (formError) setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setErrors({ email: emailErr, password: passwordErr });
    setTouched({ email: true, password: true });
    if (emailErr) { emailRef.current?.focus(); return; }
    if (passwordErr) { passwordRef.current?.focus(); return; }

    setFormError("");
    setStatus("loading");
    try {
      await loginRequest(email, password);
      setStatus("success");
      fireToast("Logged in successfully", "success");
    } catch (err) {
      setStatus("idle");
      setFormError(err.message);
      fireToast("Login failed", "error");
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F9F9F6", fontFamily: "Poppins, sans-serif", color: "#000" }}>
      <header className="h-16 flex items-center border-b" style={{ borderColor: "#E9E8E2" }}>
        <div className="mx-auto w-full max-w-[1240px] px-8">
          <a href="#" className="inline-flex items-center gap-2 font-semibold text-[18px]">
            <span className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-[12px] font-semibold" style={{ background: "#A3C1BF" }}>
              L10
            </span>
            Land10
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-[420px] rounded-[24px] bg-white"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}
        >
          {status !== "success" ? (
            <div className="p-7">
              <h1 className="text-[20px] font-semibold">Log in to Land10</h1>
              <p className="mt-1 mb-6 text-[15px]" style={{ color: "#5B5B58" }}>
                Access verified suppliers and manage your wholesale orders.
              </p>

              {formError && (
                <div role="alert" className="mb-5 rounded-[10px] px-4 py-3 text-[12px]" style={{ color: "#C6564D", background: "rgba(198,86,77,0.05)", border: "1px solid rgba(198,86,77,0.3)" }}>
                  {formError}
                </div>
              )}

              <form noValidate onSubmit={handleSubmit}>
                <div className="mb-3.5">
                  <label htmlFor="email" className="mb-1.5 block text-[12px] font-medium">Email Address</label>
                  <input
                    id="email"
                    ref={emailRef}
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className="h-[46px] w-full rounded-[10px] px-3.5 text-[15px] outline-none transition-colors"
                    style={{ border: `1px solid ${errors.email ? "#C6564D" : "#E9E8E2"}`, fontFamily: "inherit" }}
                    onFocus={(e) => { if (!errors.email) e.target.style.borderColor = "#85A6A3"; }}
                  />
                  <Hint message={errors.email} />
                </div>

                <div className="mb-2">
                  <label htmlFor="password" className="mb-1.5 block text-[12px] font-medium">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      onBlur={() => handleBlur("password")}
                      className="h-[46px] w-full rounded-[10px] pl-3.5 pr-11 text-[15px] outline-none transition-colors"
                      style={{ border: `1px solid ${errors.password ? "#C6564D" : "#E9E8E2"}`, fontFamily: "inherit" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] hover:bg-black/5"
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

                <div className="mb-5 mt-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[12px]" style={{ color: "#5B5B58" }}>
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4" style={{ accentColor: "#85A6A3" }} />
                    Remember me
                  </label>
                  <a href="#" className="text-[12px] font-medium underline underline-offset-2">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex h-12 w-full items-center justify-center rounded-[16px] text-[15px] font-medium transition-transform active:scale-[0.97]"
                  style={{
                    background: status === "loading" ? "#E9E8E2" : "#A3C1BF",
                    color: status === "loading" ? "#5B5B58" : "#000",
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => { if (status !== "loading") e.currentTarget.style.background = "#85A6A3"; }}
                  onMouseLeave={(e) => { if (status !== "loading") e.currentTarget.style.background = "#A3C1BF"; }}
                >
                  {status === "loading" ? "Logging in…" : "Log In →"}
                </button>
              </form>

              <p className="mt-6 text-center text-[12px]" style={{ color: "#5B5B58" }}>
                New to Land10?{" "}
                <a href="#" className="font-medium underline underline-offset-2" style={{ color: "#000" }}>Register as a Buyer</a>{" "}
                or{" "}
                <a href="#" className="font-medium underline underline-offset-2" style={{ color: "#000" }}>Register as a Seller</a>
              </p>
              <p className="mt-4 text-center text-[11px]" style={{ color: "#5B5B58" }}>
                Try <code>wrongpass</code> as the password to preview the error state.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-full" style={{ background: "#A3C1BF" }}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#000" strokeWidth="2.5">
                  <polyline points="4 13 9 18 20 6" />
                </svg>
              </div>
              <h3 className="text-[20px] font-semibold">Welcome back!</h3>
              <p className="mt-1 mb-6 text-[15px]" style={{ color: "#5B5B58" }}>
                You're logged in. Taking you to your Land10 dashboard.
              </p>
              <button
                type="button"
                onClick={() => fireToast("Redirecting to your dashboard…", "success")}
                className="flex h-12 w-full items-center justify-center rounded-[16px] text-[15px] font-medium active:scale-[0.97]"
                style={{ background: "#A3C1BF", color: "#000" }}
              >
                Continue to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="pb-8 text-center text-[11px]" style={{ color: "#5B5B58" }}>Made for Pakistani businesses 🇵🇰</footer>

      <div
        role="status"
        className="fixed bottom-6 left-1/2 z-[500] flex items-center gap-2.5 rounded-[16px] px-5 py-3 text-[15px] font-medium text-white transition-all"
        style={{
          background: toast.tone === "success" ? "#000" : "#C6564D",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          opacity: toast.show ? 1 : 0,
          visibility: toast.show ? "visible" : "hidden",
          transform: `translate(-50%, ${toast.show ? "0" : "12px"})`,
        }}
      >
        {toast.tone === "success" ? (
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="#A3C1BF" strokeWidth="2.5">
            <polyline points="4 13 9 18 20 6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="#fff" strokeWidth="2.5">
            <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}