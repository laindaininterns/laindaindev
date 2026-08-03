import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const catalogProducts = [
  // Row 1
  { id: 1, title: 'Green Tea', price: '$15', category: 'Green tea' },
  { id: 2, title: 'White Tea', price: '$31', category: 'White tea' },
  { id: 3, title: 'Super Matcha', price: '$12', category: 'Green tea' },
  { id: 4, title: 'Rooibos Fruit Tea', price: '$12', category: 'Rooibos tea' },
  // Row 2
  { id: 5, title: 'White Tea', price: '$10', category: 'White tea' },
  { id: 6, title: 'Black Tea', price: '$10', category: 'Black Tea' },
  { id: 7, title: 'Green Jasmine Tea', price: '$12', category: 'Green tea' },
  { id: 8, title: 'Christmas Rooibos', price: '$17', category: 'Rooibos tea' },
  // Row 3
  { id: 9, title: 'Green Tea', price: '$15', category: 'Green tea' },
  { id: 10, title: 'White Tea', price: '$31', category: 'White tea' },
  { id: 11, title: 'Super Matcha', price: '$12', category: 'Green tea' },
  { id: 12, title: 'Rooibos Fruit Tea', price: '$12', category: 'Rooibos tea' },
  // Row 4
  { id: 13, title: 'White Tea', price: '$10', category: 'White tea' },
  { id: 14, title: 'Black Tea', price: '$10', category: 'Black Tea' },
  { id: 15, title: 'Green Jasmine Tea', price: '$12', category: 'Green tea' },
  { id: 16, title: 'Christmas Rooibos', price: '$17', category: 'Rooibos tea' },
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

const CategoryPage = ({ onSelectProduct }) => {
  const [selectedPill, setSelectedPill] = useState(null);
  const [caffeinated, setCaffeinated] = useState(false);
  const [decaffeinated, setDecaffeinated] = useState(false);
  const [openTeaType, setOpenTeaType] = useState(false);
  const [openSize, setOpenSize] = useState(false);

  const pills = ['Black Tea', 'Green tea', 'Rooibos tea', 'White tea'];

  const filteredProducts = catalogProducts.filter((product) => {
    if (selectedPill && product.category !== selectedPill) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full bg-[#FDF9F6] text-[#000000]">
      {/* 1. Header Banner Visual Box */}
      <section className="w-full h-44 md:h-64 bg-[#D9D9D9] mb-10 border-b border-gray-300" />

      {/* 2. Main Filter & Catalog Grid Container */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-20">
        {/* Filter Title & Quick Category Pills Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#000000]">
            Filter
          </h2>

          {/* Quick Pill Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {pills.map((pill) => {
              const isSelected = selectedPill === pill;
              return (
                <button
                  key={pill}
                  onClick={() => setSelectedPill(isSelected ? null : pill)}
                  className={`px-6 py-2 rounded-full text-xs md:text-sm font-medium border border-[#000000] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-black text-white'
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
            {/* Tea Type Box */}
            <div className="border border-black bg-white">
              <button
                onClick={() => setOpenTeaType(!openTeaType)}
                className="w-full p-3 text-left text-sm font-normal text-black flex items-center justify-between focus:outline-none"
              >
                <span>Tea type</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openTeaType ? 'rotate-180' : ''}`} />
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

            {/* Size Box */}
            <div className="border border-black bg-white">
              <button
                onClick={() => setOpenSize(!openSize)}
                className="w-full p-3 text-left text-sm font-normal text-black flex items-center justify-between focus:outline-none"
              >
                <span>Size</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openSize ? 'rotate-180' : ''}`} />
              </button>
              {openSize && (
                <div className="px-3 pb-3 pt-1 border-t border-gray-200 text-xs space-y-1.5 text-gray-700">
                  <div className="cursor-pointer hover:text-black py-0.5">50g Loose Leaf</div>
                  <div className="cursor-pointer hover:text-black py-0.5">100g Bulk Pack</div>
                  <div className="cursor-pointer hover:text-black py-0.5">500g Wholesale Box</div>
                </div>
              )}
            </div>

            {/* Strength Box */}
            <div className="border border-black bg-white p-3 text-sm font-normal text-black">
              Strength
            </div>

            {/* Caffeine Box */}
            <div className="border border-black bg-white p-3">
              <div className="text-sm font-normal text-black mb-3">Caffeine</div>
              <div className="space-y-2 text-xs text-gray-800">
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
            </div>

            {/* Source Box */}
            <div className="border border-black bg-white p-3 text-sm font-normal text-black">
              Source
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

      {/* 3. Bestsellers Section (Matching bottom section of Category dedicated page) */}
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
