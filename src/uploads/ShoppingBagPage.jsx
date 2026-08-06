import React, { useState } from 'react';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

const ShoppingBagPage = ({
  cartItem = {
    title: 'Green Tea',
    price: '$31',
    quantity: 1,
  },
  onNavigate,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const [quantity, setQuantity] = useState(cartItem.quantity || 1);
  const [isGiftWrapped, setIsGiftWrapped] = useState(true);
  const [isSubscribedNewsletter, setIsSubscribedNewsletter] = useState(false);

  const handleDecrease = () => {
    if (quantity > 1) {
      const newQty = quantity - 1;
      setQuantity(newQty);
      if (onUpdateQuantity) onUpdateQuantity(newQty);
    }
  };

  const handleIncrease = () => {
    const newQty = quantity + 1;
    setQuantity(newQty);
    if (onUpdateQuantity) onUpdateQuantity(newQty);
  };

  return (
    <div className="w-full bg-[#FDF9F6] text-[#000000] font-poppins min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Back Link */}
        <button
          onClick={() => onNavigate && onNavigate('shop')}
          className="flex items-center space-x-2 text-sm text-black hover:opacity-75 mb-6 cursor-pointer focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Page Title */}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#000000] mb-10">
          My shopping bag
        </h1>

        {/* Shopping Bag Item Box (Exact match to figma-screens/shopping-bag.png) */}
        <div className="border border-black bg-white mb-8 max-w-4xl">
          <div className="flex flex-col md:flex-row items-stretch">
            {/* Left Section: Image, Title, Price Badge */}
            <div className="flex-1 p-6 flex items-center space-x-6">
              {/* Image Placeholder */}
              <div className="w-32 md:w-40 h-24 md:h-28 bg-[#D9D9D9] shrink-0" />

              {/* Details */}
              <div className="space-y-3">
                <h3 className="text-xl md:text-2xl font-normal text-[#000000]">
                  {cartItem.title || 'Green Tea'}
                </h3>
                <div className="inline-block bg-gray-100 text-black text-xs font-semibold px-4 py-1.5 rounded-full">
                  {cartItem.price || '$31'}
                </div>
              </div>
            </div>

            {/* Right Section: Quantity & Remove (Divided by vertical black border) */}
            <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-black flex flex-col justify-between">
              {/* Top Row: Quantity Counter */}
              <div className="p-6 flex items-center justify-between">
                <span className="text-base md:text-lg font-bold text-black">
                  Quantity:
                </span>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleDecrease}
                    className="p-1 hover:bg-gray-100 text-black focus:outline-none cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <span className="text-base font-semibold text-black w-4 text-center">
                    {quantity}
                  </span>

                  <button
                    onClick={handleIncrease}
                    className="p-1 hover:bg-gray-100 text-black focus:outline-none cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Bottom Row: Remove Button (Divided by horizontal black line) */}
              <div className="border-t border-black p-4 flex justify-end">
                <button
                  onClick={() => onRemoveItem && onRemoveItem()}
                  className="text-sm font-normal text-black hover:underline focus:outline-none cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Options Checkboxes */}
        <div className="space-y-3 mb-10 text-xs md:text-sm text-gray-800">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isGiftWrapped}
              onChange={(e) => setIsGiftWrapped(e.target.checked)}
              className="w-4 h-4 border-black rounded-none accent-black"
            />
            <span>Buying as a Gift? Tick here to include gift wrapping.</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isSubscribedNewsletter}
              onChange={(e) => setIsSubscribedNewsletter(e.target.checked)}
              className="w-4 h-4 border-black rounded-none accent-black"
            />
            <span>Do you want to subscribe to our newsletter for limited offers and promotions?</span>
          </label>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate && onNavigate('checkout')}
            className="bg-black text-white px-8 py-3.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer focus:outline-none"
          >
            Go to checkout
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate && onNavigate('shop')}
            className="border border-black bg-white text-black px-8 py-3.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none"
          >
            Back to store
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ShoppingBagPage;
