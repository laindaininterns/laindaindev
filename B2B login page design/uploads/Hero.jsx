import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

const Hero = () => {
  return (
    <section className="w-full bg-[#FDF9F6] py-8 md:py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left: Hero Image Block */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#D9D9D9] w-full h-[340px] md:h-[460px] rounded-none flex items-center justify-center relative overflow-hidden shadow-xs group"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent opacity-60" />
          <span className="text-gray-500 font-light text-base md:text-lg z-10">Hero Visual Placeholder</span>
        </motion.div>

        {/* Right: Text & CTA */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col justify-center items-start space-y-6 md:pl-6 max-w-xl"
        >
          <h1 className="text-4xl md:text-5xl font-light text-[#000000] tracking-tight leading-tight">
            Welcome to <br />
            <span className="font-normal">Lain Dain</span>
          </h1>

          <p className="text-sm md:text-base text-gray-700 font-light leading-relaxed">
            At LainDain, we empower businesses with direct wholesale sourcing and bulk procurement from verified manufacturers around the globe. From raw materials to finished commercial goods, we provide top-tier supply chain solutions tailored for every business need.
          </p>

          <Button variant="primary" size="md">
            Shop now
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
