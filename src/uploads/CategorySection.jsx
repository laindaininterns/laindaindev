import React from 'react';
import { motion } from 'framer-motion';

const CategorySection = ({ onSelectCategory }) => {
  const categories = [
    { title: 'Tea & Wholesale Commodities', label: 'Tea' },
    { title: 'Bulk Order Bundles', label: 'Bundles' },
    { title: 'Enterprise Subscriptions', label: 'Subscription' },
  ];

  return (
    <section className="w-full bg-[#FDF9F6] py-12 md:py-16 px-6 md:px-12 border-t border-gray-100">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12">
        {categories.map((cat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
            whileHover={{ y: -6 }}
            onClick={() => onSelectCategory && onSelectCategory(cat.label)}
            className="flex flex-col items-center cursor-pointer group"
          >
            {/* Image Placeholder Block */}
            <div className="bg-[#D9D9D9] w-full h-44 md:h-48 rounded-xl mb-4 shadow-xs overflow-hidden flex items-center justify-center relative border border-gray-200/50">
              <span className="text-gray-400 text-xs font-light group-hover:scale-105 transition-transform duration-300">
                {cat.title}
              </span>
            </div>

            {/* Category Label */}
            <h3 className="text-lg md:text-xl font-normal text-[#000000] text-center tracking-wide group-hover:text-[#A3C1BF] transition-colors">
              {cat.label}
            </h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
