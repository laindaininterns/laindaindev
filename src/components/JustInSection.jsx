import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';

const JustInSection = () => {
  const products = [
    {
      id: 1,
      title: 'Cement',
      description: 'We have a huge variety of the cements available',
      isNew: true,
      badgeText: 'NEW PRODUCT',
    },
    {
      id: 2,
      title: 'Tables',
      description: 'We have a huge no of tables available',
      isNew: false,
    },
    {
      id: 3,
      title: 'Books',
      description: 'We have a huge variety of books available',
      isNew: true,
      badgeText: 'NEW PRODUCT',
    },
  ];

  return (
    <section className="w-full bg-[#A3C1BF]/35 py-16 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-light text-[#000000] tracking-tight mb-2">
            Just in!
          </h2>
          <p className="text-sm md:text-base text-gray-800 font-light">
            Browse our newest products
          </p>
        </motion.div>

        {/* 3 Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {products.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <ProductCard
                title={item.title}
                description={item.description}
                isNew={item.isNew}
                badgeText={item.badgeText}
                variant="standard"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default JustInSection;
