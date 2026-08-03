import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, RefreshCw, X } from 'lucide-react';
import Button from './Button';

const SubscriptionSection = () => {
  const steps = [
    {
      icon: <Edit3 className="w-8 h-8 text-[#000000]" />,
      pillText: 'Pick your favorite items',
    },
    {
      icon: <RefreshCw className="w-8 h-8 text-[#000000]" />,
      pillText: 'Choose periodicity',
    },
    {
      icon: <X className="w-8 h-8 text-[#000000]" />,
      pillText: 'Cancel anytime',
    },
  ];

  return (
    <section className="w-full bg-[#FDF9F6] py-16 md:py-24 px-6 md:px-12 border-b border-gray-100">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-light text-[#000000] tracking-tight mb-4"
        >
          Love our platform?
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs md:text-sm text-gray-700 font-light max-w-2xl leading-relaxed mb-12"
        >
          Join our yearly subscription and save 40%! Also, get one extra bulk order tier as a bonus. No strings attached, simple one click cancellation.
        </motion.p>

        {/* 3 Step Icons & Pills */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14 mb-10 w-full">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="flex flex-col items-center space-y-4"
            >
              {/* Icon Container Box */}
              <div className="w-24 h-24 bg-[#EAEAEA] rounded-2xl flex items-center justify-center shadow-xs border border-gray-200/40">
                {step.icon}
              </div>

              {/* Text Pill */}
              <div className="bg-[#F0F0F0] px-5 py-2.5 rounded-md text-xs font-medium text-[#000000] border border-gray-200/60 shadow-2xs">
                {step.pillText}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subscribe Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <Button variant="primary" size="md">
            Subscribe now
          </Button>

          <a
            href="#"
            className="text-[11px] md:text-xs text-gray-500 font-light mt-4 hover:text-[#000000] transition-colors"
          >
            Existing subscriber? Change your preferences here.
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default SubscriptionSection;
