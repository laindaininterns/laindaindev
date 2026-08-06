import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CartOverviewPage = ({
  cartItem = {
    title: 'Green Tea',
    variant: 'Packed Bags',
    quantity: 1,
    price: '$31',
  },
  onNavigate,
}) => {
  const [shippingMethod, setShippingMethod] = useState('post_office');
  const [paymentOption, setPaymentOption] = useState('mobile_pay');
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    address: '',
    city: '',
    zipCode: '',
  });
  const [isOrderFinished, setIsOrderFinished] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsOrderFinished(true);
  };

  return (
    <div className="w-full bg-[#FDF9F6] text-[#000000] font-poppins min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Back Link */}
        <button
          onClick={() => onNavigate && onNavigate('bag')}
          className="flex items-center space-x-2 text-sm text-black hover:opacity-75 mb-6 cursor-pointer focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Main 2-Column Grid (Items Overview Left, Payment Details Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Items Overview */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#000000] mb-3">
                Items overview
              </h1>
              <p className="text-xs md:text-sm text-gray-600 max-w-lg leading-relaxed">
                This is your order summary where you can edit and delete your order and select your preferred delivery type.
              </p>
            </div>

            {/* Order Summary Item Box (Exact match to figma-screens/cart-overview.png) */}
            <div className="border border-black bg-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-5">
                {/* Image Placeholder */}
                <div className="w-28 md:w-36 h-20 md:h-24 bg-[#D9D9D9] shrink-0" />

                {/* Details */}
                <div className="space-y-1">
                  <h3 className="text-lg md:text-xl font-normal text-[#000000]">
                    {cartItem.title || 'Green Tea'}
                  </h3>
                  <p className="text-xs text-gray-600">{cartItem.variant || 'Packed Bags'}</p>
                  <p className="text-xs text-gray-600">Quantity: {cartItem.quantity || 1}</p>
                </div>
              </div>

              {/* Price */}
              <div className="text-2xl font-bold text-[#000000]">
                {cartItem.price || '$31'}
              </div>
            </div>

            {/* Available Shipping Methods */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-[#000000]">
                Available Shipping Methods
              </h3>

              <div
                onClick={() => setShippingMethod('post_office')}
                className="border border-black bg-white p-4 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                    {shippingMethod === 'post_office' && (
                      <div className="w-2 h-2 rounded-full bg-black" />
                    )}
                  </div>
                  <span className="text-sm text-black font-normal">Post Office Deliver</span>
                </div>

                <span className="text-sm text-black font-normal">Free</span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-[#000000]">
                Payment Options
              </h3>

              <div
                onClick={() => setPaymentOption('mobile_pay')}
                className="border border-black bg-white p-4 flex items-center space-x-3 cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full border border-black flex items-center justify-center">
                  {paymentOption === 'mobile_pay' && (
                    <div className="w-2 h-2 rounded-full bg-black" />
                  )}
                </div>
                <span className="text-sm text-black font-normal">Mobile Pay</span>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Details Form */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#000000] mb-3">
                Payment details
              </h1>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                Fill in your payment details and complete the order.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
              {/* Form Input Fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-normal text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full border-b border-gray-300 py-2 bg-transparent text-sm text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full border-b border-gray-300 py-2 bg-transparent text-sm text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full border-b border-gray-300 py-2 bg-transparent text-sm text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full border-b border-gray-300 py-2 bg-transparent text-sm text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="w-full border-b border-gray-300 py-2 bg-transparent text-sm text-black focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full bg-[#262B2E] hover:bg-black text-white py-3.5 rounded-lg text-base font-medium text-center transition-colors cursor-pointer focus:outline-none"
              >
                Finish purchase
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      {/* Order Success Modal */}
      <AnimatePresence>
        {isOrderFinished && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-xl max-w-md w-full text-center space-y-5 border border-black shadow-2xl"
            >
              <CheckCircle2 className="w-16 h-16 text-[#A3C1BF] mx-auto" />
              <h2 className="text-2xl font-bold text-black">Order Placed Successfully!</h2>
              <p className="text-sm text-gray-600">
                Thank you for your purchase with LainDain B2B. We've sent a confirmation email with tracking details.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsOrderFinished(false);
                  if (onNavigate) onNavigate('home');
                }}
                className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Return to Home
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartOverviewPage;
