import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const catalogProducts = [
  // Green Tea selection (matching Figma filtered page mockup)
  { id: 1, title: 'Green Tea', price: '$15', category: 'Green tea', tagline: 'Strong & Energizing' },
  { id: 2, title: 'Green Tea', price: '$31', category: 'Green tea', tagline: 'Premium Organic' },
  { id: 3, title: 'Green Tea', price: '$12', category: 'Green tea', tagline: 'Light & Fresh' },
  { id: 4, title: 'Green Tea', price: '$12', category: 'Green tea', tagline: 'Classic Blend' },
  { id: 5, title: 'Green Tea', price: '$10', category: 'Green tea', tagline: 'Daily Harvest' },
  { id: 6, title: 'Green Tea', price: '$10', category: 'Green tea', tagline: 'Gentle Aroma' },
  { id: 7, title: 'Green Tea', price: '$12', category: 'Green tea', tagline: 'Jasmine Infused' },
  { id: 8, title: 'Green Tea', price: '$17', category: 'Green tea', tagline: 'Special Reserve' },
  { id: 9, title: 'Green Tea', price: '$10', category: 'Green tea', tagline: 'Traditional Loose Leaf' },

  // Other category teas for dynamic pill filtering
  { id: 10, title: 'Black Tea', price: '$15', category: 'Black Tea', tagline: 'Bold & Full Body' },
  { id: 11, title: 'Black Tea', price: '$22', category: 'Black Tea', tagline: 'Earl Grey Special' },
  { id: 12, title: 'White Tea', price: '$31', category: 'White tea', tagline: 'Delicate Silver Needle' },
  { id: 13, title: 'Rooibos Fruit Tea', price: '$17', category: 'Rooibos tea', tagline: 'Caffeine Free Herbal' },
];

const bestsellerItems = [
  {
    id: 'b1',
    title: 'Earl Gray',
    price: '$9',
    subtitle: 'Bold and Fruit Taste',
  },
  {
    id: 'b2',
    title: 'Jasmine Tea',
    price: '$9',
    subtitle: 'Light and Refreshing Taste',
  },
];

const CategoryPage = ({ onSelectProduct, initialCategory = 'Green tea' }) => {
  const [selectedPill, setSelectedPill] = useState(initialCategory);
  const [caffeinated, setCaffeinated] = useState(true);
  const [decaffeinated, setDecaffeinated] = useState(false);

  // Accordion state management
  const [openTeaType, setOpenTeaType] = useState(false);
  const [openSize, setOpenSize] = useState(false);
  const [openStrength, setOpenStrength] = useState(false);
  const [openCaffeine, setOpenCaffeine] = useState(true); // Open by default per Figma spec
  const [openSource, setOpenSource] = useState(false);

  const pills = ['Black Tea', 'Green tea', 'Rooibos tea', 'White tea'];

  // Filter products based on selected pill/category
  const filteredProducts = catalogProducts.filter((product) => {
    if (selectedPill && product.category.toLowerCase() !== selectedPill.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Display title based on active pill filter
  const categoryTitle = selectedPill || 'Tea';

  return (
    <div className="w-full bg-[#FDF9F6] text-[#000000] font-poppins">
      {/* 1. Top Header Banner Section (Split view: Title Left, Image Placeholder Right) */}
      <section className="w-full flex flex-col md:flex-row items-stretch border-b border-gray-300 mb-12">
        {/* Left Title Panel */}
        <div className="w-full md:w-5/12 bg-[#EAE5DF] p-8 md:p-14 flex items-center justify-start border-b md:border-b-0 md:border-r border-gray-300">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#000000] leading-none">
              {categoryTitle}
            </h1>
            <p className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#000000] leading-none">
              Selection
            </p>
          </div>
        </div>

        {/* Right Visual Image Placeholder Panel */}
        <div className="w-full md:w-7/12 min-h-[220px] md:min-h-[320px] bg-[#D9D9D9] flex items-center justify-center">
          <span className="text-gray-400 font-medium text-lg hidden">Image Banner</span>
        </div>
      </section>

      {/* 2. Main Filter & Catalog Grid Container */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-20">
        {/* Category Pills Row (Aligned above the product grid) */}
        <div className="flex justify-end mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {pills.map((pill) => {
              const isSelected = selectedPill?.toLowerCase() === pill.toLowerCase();
              return (
                <button
                  key={pill}
                  onClick={() => setSelectedPill(isSelected ? null : pill)}
                  className={`px-6 py-2 rounded-full text-xs md:text-sm font-medium border border-[#000000] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#A3C1BF] text-black shadow-xs font-semibold'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar & Product Grid */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Sidebar Filter Column */}
          <aside className="w-full md:w-56 shrink-0 space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#000000] mb-4">
              Filter
            </h2>

            {/* Tea Type Accordion */}
            <div className="border border-black bg-white">
              <button
                onClick={() => setOpenTeaType(!openTeaType)}
                className="w-full p-3 text-left text-sm font-normal text-black flex items-center justify-between focus:outline-none cursor-pointer"
              >
                <span>Tea type</span>
                {openTeaType ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openTeaType && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-200 text-xs space-y-1.5 text-gray-700">
                  {pills.map((type) => (
                    <div
                      key={type}
                      onClick={() => setSelectedPill(selectedPill === type ? null : type)}
                      className={`cursor-pointer hover:text-black py-0.5 ${selectedPill === type ? 'font-semibold text-black' : ''}`}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Size Accordion */}
            <div className="border border-black bg-white">
              <button
                onClick={() => setOpenSize(!openSize)}
                className="w-full p-3 text-left text-sm font-normal text-black flex items-center justify-between focus:outline-none cursor-pointer"
              >
                <span>Size</span>
                {openSize ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSize && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-200 text-xs space-y-1.5 text-gray-700">
                  <div className="cursor-pointer hover:text-black py-0.5">50g Loose Leaf</div>
                  <div className="cursor-pointer hover:text-black py-0.5">100g Bulk Pack</div>
                  <div className="cursor-pointer hover:text-black py-0.5">500g Wholesale Box</div>
                </div>
              )}
            </div>

            {/* Strength Accordion */}
            <div className="border border-black bg-white">
              <button
                onClick={() => setOpenStrength(!openStrength)}
                className="w-full p-3 text-left text-sm font-normal text-black flex items-center justify-between focus:outline-none cursor-pointer"
              >
                <span>Strength</span>
                {openStrength ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openStrength && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-200 text-xs space-y-1.5 text-gray-700">
                  <div className="cursor-pointer hover:text-black py-0.5">Mild</div>
                  <div className="cursor-pointer hover:text-black py-0.5">Medium</div>
                  <div className="cursor-pointer hover:text-black py-0.5">Strong</div>
                </div>
              )}
            </div>

            {/* Caffeine Accordion (Expanded by default matching Figma screenshot) */}
            <div className="border border-black bg-white">
              <button
                onClick={() => setOpenCaffeine(!openCaffeine)}
                className="w-full p-3 text-left text-sm font-normal text-black flex items-center justify-between focus:outline-none cursor-pointer"
              >
                <span>Caffeine</span>
                {openCaffeine ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openCaffeine && (
                <div className="px-3 pb-3 pt-1 space-y-2 text-xs text-gray-800">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={caffeinated}
                      onChange={(e) => setCaffeinated(e.target.checked)}
                      className="w-3.5 h-3.5 border-black rounded-none accent-black"
                    />
                    <span>Caffeinated</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={decaffeinated}
                      onChange={(e) => setDecaffeinated(e.target.checked)}
                      className="w-3.5 h-3.5 border-black rounded-none accent-black"
                    />
                    <span>Decaffeinated</span>
                  </label>
                </div>
              )}
            </div>

            {/* Source Accordion */}
            <div className="border border-black bg-white">
              <button
                onClick={() => setOpenSource(!openSource)}
                className="w-full p-3 text-left text-sm font-normal text-black flex items-center justify-between focus:outline-none cursor-pointer"
              >
                <span>Source</span>
                {openSource ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSource && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-200 text-xs space-y-1.5 text-gray-700">
                  <div className="cursor-pointer hover:text-black py-0.5">Single Origin</div>
                  <div className="cursor-pointer hover:text-black py-0.5">Blended</div>
                  <div className="cursor-pointer hover:text-black py-0.5">Estate Grown</div>
                </div>
              )}
            </div>
          </aside>

          {/* Right Product Grid Column */}
          <main className="flex-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-gray-300 bg-gray-300 gap-px">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct && onSelectProduct(product)}
                  className="cursor-pointer"
                >
                  <ProductCard
                    variant="catalog"
                    title={product.title}
                    price={product.price}
                  />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* 3. Bestsellers Section (Matching bottom section of Category page) */}
      <section className="w-full bg-[#FDF9F6] py-16 px-6 md:px-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          {/* Left Text Block */}
          <div className="md:w-1/2 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#000000]">
              Try our bestsellers
            </h2>
            <p className="text-xs md:text-sm text-gray-700 font-light leading-relaxed max-w-md">
              At our shop, we believe in the power of herbs to heal and nourish the body. That's why we've carefully curated a selection of the finest herbal teas from around the world. From refreshing mint to soothing chamomile, we have a tea for every mood and occasion.
            </p>
          </div>

          {/* Right Cards & Carousel Control */}
          <div className="md:w-1/2 flex items-center justify-end space-x-6 w-full overflow-x-auto pb-4 md:pb-0">
            <div className="flex items-center space-x-6">
              {bestsellerItems.map((item) => (
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
                    className="w-64 flex-shrink-0"
                  />
                </div>
              ))}
            </div>

            {/* Next Chevron Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 border border-black rounded-none bg-white text-black hover:bg-black hover:text-white transition-colors shrink-0 cursor-pointer"
              aria-label="Next Bestsellers"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;
