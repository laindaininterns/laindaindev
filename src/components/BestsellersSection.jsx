import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

const BestsellersSection = () => {
  const bestsellers = [
    {
      id: 1,
      title: 'Earl Gray',
      subtitle: 'Bold and Fruit Taste',
      price: '$9',
    },
    {
      id: 2,
      title: 'Jasmine Tea',
      subtitle: 'Light and Refreshing Taste',
      price: '$9',
    },
  ];

  return (
    <section className="w-full bg-[#EBF0EF] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
        {/* Left Side: Text Description */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="md:col-span-5 space-y-6"
        >
          <h2 className="text-3xl md:text-5xl font-light text-[#000000] tracking-tight leading-tight">
            Try our bestsellers
          </h2>
          <p className="text-xs md:text-sm text-gray-700 font-light leading-relaxed">
            At LainDain, we supply verified high-grade bulk inventory directly from trusted manufacturers worldwide. From raw materials to ready-to-ship trade goods, discover our most requested wholesale items curated for performance and reliability.
          </p>
        </motion.div>

        {/* Right Side: Horizontal Product Cards + Arrow */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="md:col-span-7 flex items-center gap-6 overflow-x-auto pb-4 pt-2 no-scrollbar"
        >
          <div className="flex items-center gap-6">
            {bestsellers.map((item) => (
              <ProductCard
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                price={item.price}
                variant="bestseller"
              />
            ))}
          </div>

          {/* Navigation Chevron */}
          <button
            className="p-3 text-[#000000] hover:translate-x-1 transition-transform cursor-pointer focus:outline-none flex-shrink-0"
            aria-label="Next bestsellers"
          >
            <ChevronRight className="w-8 h-8 stroke-[1.5]" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default BestsellersSection;
