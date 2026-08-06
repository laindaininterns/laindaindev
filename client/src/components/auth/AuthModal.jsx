import React, { useEffect } from "react";
import LoginScreen from "./LoginScreen";
import ForgotPasswordScreen from "./ForgotPasswordScreen";
import RegisterBuyerScreen from "./RegisterBuyerScreen";
import RegisterSellerScreen from "./RegisterSellerScreen";
import { TOKENS } from "../../data/marketplaceData";

export default function AuthModal({
  isOpen,
  initialScreen = "login",
  onClose,
  onLoginSuccess,
  onRegisterSuccess,
}) {
  const [activeScreen, setActiveScreen] = React.useState(initialScreen);

  useEffect(() => {
    setActiveScreen(initialScreen);
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

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] max-h-[92vh] bg-white rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col border border-[#E9E8E2] transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Mode Switcher & Close */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 bg-[#F9F9F6] border-b border-[#E9E8E2]">
          <div className="flex items-center gap-1 rounded-[999px] bg-[#EEF3F2] p-1 border border-[#E9E8E2]">
            <button
              onClick={() => setActiveScreen("login")}
              className={`px-3 py-1 text-[12px] font-semibold rounded-full transition-all ${
                activeScreen === "login" || activeScreen === "forgot_password"
                  ? "bg-black text-white shadow-xs"
                  : "text-[#5B5B58] hover:text-black"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setActiveScreen("register_buyer")}
              className={`px-3 py-1 text-[12px] font-semibold rounded-full transition-all ${
                activeScreen === "register_buyer"
                  ? "bg-black text-white shadow-xs"
                  : "text-[#5B5B58] hover:text-black"
              }`}
            >
              Buyer
            </button>
            <button
              onClick={() => setActiveScreen("register_seller")}
              className={`px-3 py-1 text-[12px] font-semibold rounded-full transition-all ${
                activeScreen === "register_seller"
                  ? "bg-black text-white shadow-xs"
                  : "text-[#5B5B58] hover:text-black"
              }`}
            >
              Seller
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] hover:bg-black/5 text-black"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeScreen === "login" && (
            <LoginScreen
              onSwitchScreen={setActiveScreen}
              onLoginSuccess={onLoginSuccess}
            />
          )}
          {activeScreen === "forgot_password" && (
            <ForgotPasswordScreen onSwitchScreen={setActiveScreen} />
          )}
          {activeScreen === "register_buyer" && (
            <RegisterBuyerScreen
              onSwitchScreen={setActiveScreen}
              onRegisterSuccess={onRegisterSuccess}
            />
          )}
          {activeScreen === "register_seller" && (
            <RegisterSellerScreen
              onSwitchScreen={setActiveScreen}
              onRegisterSuccess={onRegisterSuccess}
            />
          )}
        </div>

        {/* Modal Footer - Continue as Guest */}
        <div className="px-6 py-3.5 bg-[#F9F9F6] border-t border-[#E9E8E2] flex items-center justify-between text-[13px]">
          <span className="text-[#5B5B58]">Want to explore first?</span>
          <button
            onClick={onClose}
            className="font-medium text-black underline underline-offset-2 hover:text-[#5B5B58]"
          >
            Continue as Guest (Skip) →
          </button>
        </div>
      </div>
    </div>
  );
}
