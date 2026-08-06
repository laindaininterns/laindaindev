import React, { useState } from "react";

export default function CheckoutModal({
  isOpen,
  onClose,
  cartSubtotal,
  currentUser,
  onCompleteOrder,
}) {
  if (!isOpen) return null;

  const [step, setStep] = useState("form"); // form | success
  const [orderNum, setOrderNum] = useState("");
  const [formData, setFormData] = useState({
    bizName: currentUser?.name ? `${currentUser.name} Enterprise` : "",
    contact: currentUser?.name || "",
    phone: "",
    address: "",
  });

  function handleSubmit(e) {
    e.preventDefault();
    const generatedOrder = "MKT-" + Math.floor(100000 + Math.random() * 900000);
    setOrderNum(generatedOrder);
    setStep("success");
    onCompleteOrder(generatedOrder);
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-[24px] shadow-2xl border border-[#E9E8E2] overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "form" ? (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E8E2] mb-4">
              <h3 className="text-[18px] font-semibold text-black">Wholesale Checkout</h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 rounded-[14px] bg-[#EEF3F2] p-3.5 text-[14px] flex justify-between items-center font-medium border border-[#E9E8E2]">
              <span className="text-[#5B5B58]">Total Amount (excl. tax)</span>
              <span className="text-[18px] font-semibold text-black">Rs. {cartSubtotal.toLocaleString()}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-black mb-1">Business Name</label>
                <input
                  required
                  type="text"
                  value={formData.bizName}
                  onChange={(e) => setFormData({ ...formData, bizName: e.target.value })}
                  placeholder="e.g. Faisalabad Traders Co."
                  className="w-full h-[42px] px-3.5 rounded-[12px] border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-black mb-1">Contact Person</label>
                  <input
                    required
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Full Name"
                    className="w-full h-[42px] px-3.5 rounded-[12px] border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-black mb-1">Phone</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="03XX XXXXXXX"
                    className="w-full h-[42px] px-3.5 rounded-[12px] border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-black mb-1">Delivery Address & City</label>
                <input
                  required
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Goods Transport Plaza, Badami Bagh, Lahore"
                  className="w-full h-[42px] px-3.5 rounded-[12px] border border-[#E9E8E2] text-[13px] outline-none focus:border-[#85A6A3]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full h-[48px] rounded-[16px] bg-[#A3C1BF] text-black font-medium text-[15px] hover:bg-[#85A6A3] transition-colors active:scale-[0.98]"
            >
              Place Order →
            </button>
          </form>
        ) : (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#A3C1BF]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#000" strokeWidth="2.5">
                <polyline points="4 13 9 18 20 6" />
              </svg>
            </div>
            <h3 className="text-[22px] font-semibold text-black">Order Placed!</h3>
            <p className="mt-1 text-[14px] text-[#5B5B58]">
              Wholesale Order Reference: <strong className="text-black">{orderNum}</strong>
            </p>
            <p className="mt-2 text-[12px] text-[#5B5B58]">
              We have notified the supplier. You will receive invoice & tracking updates on your phone.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full h-[46px] rounded-[16px] bg-black text-white font-medium text-[14px] hover:bg-black/80 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
