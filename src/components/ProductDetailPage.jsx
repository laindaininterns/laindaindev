import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductDetailPage = ({
  product = {
    title: 'Green Tea',
    category: 'Loose leaf tea',
    tagline: 'Strong & Energizing',
    rating: 5,
    reviewCount: 483,
    description:
      'This tea is known for its strong, robust flavor and its refreshing, invigorating aroma. It is a popular choice for those who enjoy a bold, full-bodied tea experience. Gunpowder Green tea is also believed to have a number of health benefits including aiding in digestion and boosting the immune system. Try it hot or iced for a tasty and healthy beverage choice.',
    price: '$31',
    imageSrc: null,
  },
  onNavigate,
  onSelectProduct,
}) => {
  const [selectedVariant, setSelectedVariant] = useState('loose'); // 'loose' | 'bags'
  const [quantity, setQuantity] = useState(1);
  const [addedToBag, setAddedToBag] = useState(false);

  const similarProducts = [
    {
      id: 'sim-1',
      title: 'Jasmine Green Tea',
      price: '$45',
      subtitle: 'Limited edition',
    },
    {
      id: 'sim-2',
      title: 'Gunpowder Green Tea',
      price: '$19',
      subtitle: 'New in',
    },
    {
      id: 'sim-3',
      title: 'Morning Bundle',
      price: '$59',
      subtitle: 'Start your day right',
    },
    {
      id: 'sim-4',
      title: 'Jasmine Green Tea',
      price: '$23',
      subtitle: 'Classic blend',
    },
  ];

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    setAddedToBag(true);
    setTimeout(() => setAddedToBag(false), 2500);
  };

  return (
    <div className="w-full bg-[#FDF9F6] text-[#000000] font-poppins min-h-screen">
      {/* 1. Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-4">
        <nav className="flex items-center text-xs md:text-sm text-gray-700 space-x-2 font-light">
          <button
            onClick={() => onNavigate && onNavigate('home')}
            className="hover:underline hover:text-black transition-colors"
          >
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <button
            onClick={() => onNavigate && onNavigate('shop')}
            className="hover:underline hover:text-black transition-colors"
          >
            All products
          </button>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="font-normal text-black underline underline-offset-4 decoration-1">
            {product.title}
          </span>
        </nav>
      </div>

      {/* 2. Main Product Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: Product Image Visual Box */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-[#D9D9D9] w-full aspect-square md:aspect-4/3 lg:aspect-square flex items-center justify-center overflow-hidden border border-gray-200/60 shadow-xs"
          >
            {product.imageSrc ? (
              <img
                src={product.imageSrc}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-sm md:text-base font-light tracking-wide">
                Image Placeholder
              </span>
            )}
          </motion.div>

          {/* Right: Detailed Product Specs & Purchase Options */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col justify-between h-full pt-2"
          >
            <div>
              {/* Product Header Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-[#000000] tracking-tight mb-2">
                {product.title}
              </h1>

              {/* Category Subtitle */}
              <h2 className="text-lg md:text-xl font-semibold text-[#000000] mb-4">
                {product.category}
              </h2>

              {/* Tagline & Star Reviews */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <span className="text-base md:text-lg font-medium text-[#000000]">
                  {product.tagline}
                </span>

                <div className="flex items-center space-x-1.5">
                  <div className="flex text-black">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-none stroke-current stroke-1.5"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 font-light ml-1">
                    {product.reviewCount} Reviews
                  </span>
                </div>
              </div>

              {/* Product Description */}
              <p className="text-xs md:text-sm text-gray-700 font-light leading-relaxed mb-8 max-w-xl">
                {product.description}
              </p>

              {/* Option Selector Pills */}
              <div className="flex items-center space-x-4 mb-8">
                <button
                  type="button"
                  onClick={() => setSelectedVariant('loose')}
                  className={`px-6 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all border ${
                    selectedVariant === 'loose'
                      ? 'border-black bg-white text-black shadow-xs'
                      : 'border-transparent bg-[#D9D9D9] text-[#000000] hover:bg-[#cfcfcf]'
                  }`}
                >
                  Loose leaf tea
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVariant('bags')}
                  className={`px-6 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all border ${
                    selectedVariant === 'bags'
                      ? 'border-black bg-white text-black shadow-xs'
                      : 'border-transparent bg-[#D9D9D9] text-[#000000] hover:bg-[#cfcfcf]'
                  }`}
                >
                  Tea bags
                </button>
              </div>

              {/* Quantity Selector & Price Grid */}
              <div className="flex items-end justify-between mb-8 max-w-md">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-[#000000] mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-4 text-2xl font-normal text-[#000000]">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      className="hover:opacity-60 transition-opacity px-1"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xl font-normal select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      className="hover:opacity-60 transition-opacity px-1"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-4xl md:text-5xl font-normal text-[#000000]">
                  {product.price}
                </div>
              </div>

              {/* Add to Bag CTA Button */}
              <div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="bg-[#2A2A2A] hover:bg-black text-white px-8 py-3.5 rounded-md text-xs md:text-sm font-medium transition-colors shadow-sm active:scale-98"
                >
                  {addedToBag ? 'Added to bag ✓' : 'Add to bag'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. "Shop similar" Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-12 pb-20">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-normal text-center text-[#000000] mb-12 tracking-tight">
          Shop similar
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {similarProducts.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectProduct && onSelectProduct(item)}
              className="cursor-pointer"
            >
              <ProductCard
                variant="bestseller"
                title={item.title}
                price={item.price}
                subtitle={item.subtitle}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProductDetailPage;
