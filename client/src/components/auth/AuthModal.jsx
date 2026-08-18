import React, { useState, useEffect } from "react";
import LoginScreen from "./LoginScreen";
import ForgotPasswordScreen from "./ForgotPasswordScreen";
import RegisterBuyerScreen from "./RegisterBuyerScreen";
import RegisterSellerScreen from "./RegisterSellerScreen";

/**
 * Normalizes input screen keys to prevent blank states
 */
function normalizeScreen(screen) {
  if (!screen || typeof screen !== "string") return "login";
  const s = screen.toLowerCase().trim();
  if (
    s === "buyer" ||
    s === "register_buyer" ||
    s === "buyer_register" ||
    s === "buyer_signup" ||
    s === "buyer-signup" ||
    s === "registerbuyer"
  ) {
    return "register_buyer";
  }
  if (
    s === "seller" ||
    s === "register_seller" ||
    s === "seller_register" ||
    s === "seller_signup" ||
    s === "seller-signup" ||
    s === "registerseller"
  ) {
    return "register_seller";
  }
  if (
    s === "forgot_password" ||
    s === "forgot" ||
    s === "forgotpassword" ||
    s === "forgot-password" ||
    s === "reset" ||
    s === "reset_password"
  ) {
    return "forgot_password";
  }
  return "login";
}

export default function AuthModal({
  isOpen,
  initialScreen = "login",
  onClose,
  onLoginSuccess,
  onRegisterSuccess,
}) {
  const [activeScreen, setActiveScreen] = useState(() => normalizeScreen(initialScreen));

  useEffect(() => {
    if (isOpen) {
      setActiveScreen(normalizeScreen(initialScreen));
    }
  }, [initialScreen, isOpen]);

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

  const currentScreen = normalizeScreen(activeScreen);

  const isLoginActive = currentScreen === "login" || currentScreen === "forgot_password";
  const isBuyerActive = currentScreen === "register_buyer";
  const isSellerActive = currentScreen === "register_seller";

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] max-h-[92vh] bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.16)] overflow-hidden flex flex-col border border-[#E9E8E2] transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Mode Switcher & Close */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 bg-[#F9F9F6] border-b border-[#E9E8E2]">
          <div className="flex items-center gap-1 rounded-[999px] bg-[#EEF3F2] p-1 border border-[#E9E8E2]">
            <button
              type="button"
              onClick={() => setActiveScreen("login")}
              className={`px-3.5 py-1 text-[12px] font-semibold rounded-full transition-all cursor-pointer ${
                isLoginActive
                  ? "bg-black text-white shadow-xs"
                  : "text-[#5B5B58] hover:text-black"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen("register_buyer")}
              className={`px-3.5 py-1 text-[12px] font-semibold rounded-full transition-all cursor-pointer ${
                isBuyerActive
                  ? "bg-black text-white shadow-xs"
                  : "text-[#5B5B58] hover:text-black"
              }`}
            >
              Buyer
            </button>
            <button
              type="button"
              onClick={() => setActiveScreen("register_seller")}
              className={`px-3.5 py-1 text-[12px] font-semibold rounded-full transition-all cursor-pointer ${
                isSellerActive
                  ? "bg-black text-white shadow-xs"
                  : "text-[#5B5B58] hover:text-black"
              }`}
            >
              Seller
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] hover:bg-black/5 text-black cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {currentScreen === "login" && (
            <LoginScreen
              onSwitchScreen={(screen) => setActiveScreen(normalizeScreen(screen))}
              onLoginSuccess={onLoginSuccess}
            />
          )}
          {currentScreen === "forgot_password" && (
            <ForgotPasswordScreen
              onSwitchScreen={(screen) => setActiveScreen(normalizeScreen(screen))}
            />
          )}
          {currentScreen === "register_buyer" && (
            <RegisterBuyerScreen
              onSwitchScreen={(screen) => setActiveScreen(normalizeScreen(screen))}
              onRegisterSuccess={onRegisterSuccess}
            />
          )}
          {currentScreen === "register_seller" && (
            <RegisterSellerScreen
              onSwitchScreen={(screen) => setActiveScreen(normalizeScreen(screen))}
              onRegisterSuccess={onRegisterSuccess}
            />
          )}
        </div>

        {/* Modal Footer - Continue as Guest */}
        <div className="px-6 py-3.5 bg-[#F9F9F6] border-t border-[#E9E8E2] flex items-center justify-between text-[13px]">
          <span className="text-[#5B5B58]">Want to explore first?</span>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-black underline underline-offset-2 hover:text-[#5B5B58] cursor-pointer"
          >
            Continue as Guest (Skip) →
          </button>
        </div>
      </div>
    </div>
  );
}
