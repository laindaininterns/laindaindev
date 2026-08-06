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
  const [selectedVariant, setSelectedVariant] = useState('Loose leaf tea');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const similarProducts = [
    {
      id: 's1',
      title: 'Jasmine Green Tea',
      price: '$45',
      tagline: 'Limited edition',
    },
    {
      id: 's2',
      title: 'Gunpowder Green Tea',
      price: '$19',
      tagline: 'New in',
    },
    {
      id: 's3',
      title: 'Morning Bundle',
      price: '$59',
      tagline: 'Start your day right',
    },
    {
      id: 's4',
      title: 'Jasmine Green Tea',
      price: '$23',
      tagline: 'Classic blend',
    },
  ];

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      if (onNavigate) {
        onNavigate('bag', {
          ...product,
          variant: selectedVariant,
          quantity: quantity,
        });
      }
    }, 600);
  };

  return (
    <div className="w-full bg-[#FDF9F6] text-[#000000] font-poppins">
      {/* 1. Breadcrumbs Navigation */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-4">
        <nav className="flex items-center space-x-2 text-xs md:text-sm text-gray-700">
          <button
            onClick={() => onNavigate && onNavigate('home')}
            className="hover:underline hover:text-black cursor-pointer focus:outline-none"
          >
            Home
          </button>
          <span>&gt;</span>
          <button
            onClick={() => onNavigate && onNavigate('shop')}
            className="hover:underline hover:text-black cursor-pointer focus:outline-none"
          >
            All products
          </button>
          <span>&gt;</span>
          <span className="font-semibold text-black">{product.title || 'Green Tea'}</span>
        </nav>
      </div>

      {/* 2. Main Product Details Section */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-6 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          {/* Left Column: Product Visual Image Placeholder Box */}
          <div className="md:col-span-6 w-full h-[320px] sm:h-[420px] md:h-[480px] bg-[#D9D9D9] border border-gray-300 flex items-center justify-center">
            <span className="text-gray-400 font-medium text-sm hidden">Image Placeholder</span>
          </div>

          {/* Right Column: Product Metadata, Copy, Controls & CTA */}
          <div className="md:col-span-6 space-y-6">
            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#000000]">
                {product.title || 'Green Tea'}
              </h1>
              <p className="text-sm md:text-base font-medium text-gray-700">
                {product.category || 'Loose leaf tea'}
              </p>
            </div>

            {/* Tagline & Reviews Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-800">
              <span className="font-normal">{product.tagline || 'Strong & Energizing'}</span>
              <span className="text-gray-400">•</span>

              {/* Stars Rating */}
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className="w-4 h-4 fill-none stroke-black stroke-[1.5]"
                  />
                ))}
              </div>

              <span className="text-xs font-normal underline cursor-pointer">
                {product.reviewCount || 483} Reviews
              </span>
            </div>

            {/* Product Description */}
            <p className="text-xs md:text-sm font-light text-gray-700 leading-relaxed max-w-xl">
              {product.description ||
                'This tea is known for its strong, robust flavor and its refreshing, invigorating aroma. It is a popular choice for those who enjoy a bold, full-bodied tea experience. Gunpowder Green tea is also believed to have a number of health benefits including aiding in digestion and boosting the immune system. Try it hot or iced for a tasty and healthy beverage choice.'}
            </p>

            {/* Packaging Variant Selectors (Loose leaf tea / Tea bags) */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setSelectedVariant('Loose leaf tea')}
                className={`px-6 py-2.5 rounded-lg text-xs md:text-sm font-normal transition-all cursor-pointer border border-[#000000] focus:outline-none ${
                  selectedVariant === 'Loose leaf tea'
                    ? 'bg-[#D9D9D9] text-black font-semibold'
                    : 'bg-[#EFEFEF] text-gray-800 hover:bg-gray-200'
                }`}
              >
                Loose leaf tea
              </button>

              <button
                onClick={() => setSelectedVariant('Tea bags')}
                className={`px-6 py-2.5 rounded-lg text-xs md:text-sm font-normal transition-all cursor-pointer border border-[#000000] focus:outline-none ${
                  selectedVariant === 'Tea bags'
                    ? 'bg-[#D9D9D9] text-black font-semibold'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                Tea bags
              </button>
            </div>

            {/* Quantity Stepper & Price Row */}
            <div className="flex items-center justify-between max-w-md pt-4">
              {/* Quantity Counter */}
              <div className="space-y-1">
                <span className="block text-xs font-normal text-black">Quantity</span>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleDecreaseQuantity}
                    className="text-lg font-normal text-black hover:opacity-70 focus:outline-none cursor-pointer px-1"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="text-base font-normal text-black w-4 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncreaseQuantity}
                    className="text-lg font-normal text-black hover:opacity-70 focus:outline-none cursor-pointer px-1"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Display */}
              <div className="text-4xl md:text-5xl font-bold tracking-tight text-[#000000]">
                {product.price || '$31'}
              </div>
            </div>

            {/* Add to Bag CTA Button */}
            <div className="pt-4 max-w-xs">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full bg-[#000000] hover:bg-gray-800 text-[#FDF9F6] py-3.5 px-8 rounded-lg text-sm font-semibold transition-all cursor-pointer focus:outline-none"
              >
                {isAdded ? 'Added to bag ✓' : 'Add to bag'}
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "Shop similar" Carousel / Recommendations Section */}
      <section className="w-full bg-[#FDF9F6] py-14 px-6 md:px-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#000000] text-center">
            Shop similar
          </h2>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectProduct && onSelectProduct(item)}
                className="cursor-pointer"
              >
                <ProductCard
                  variant="similar"
                  title={item.title}
                  price={item.price}
                  subtitle={item.tagline}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailPage;
