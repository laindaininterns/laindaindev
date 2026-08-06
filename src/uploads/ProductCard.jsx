import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

const ProductCard = ({
  title,
  description,
  subtitle,
  price,
  isNew = false,
  badgeText = 'NEW PRODUCT',
  imageSrc,
  variant = 'standard', // 'standard' | 'bestseller'
  onActionClick,
  className = '',
  actionText = 'Buy now'
}) => {
  if (variant === 'bestseller' || variant === 'similar') {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={`bg-white p-5 shadow-sm rounded-none text-center border border-gray-200/80 flex flex-col items-center justify-between w-full h-full ${className}`}
      >
        {/* Image Placeholder / Visual */}
        <div className="bg-[#D9D9D9] w-full h-40 mb-4 rounded-none flex items-center justify-center overflow-hidden relative group">
          {imageSrc ? (
            <img src={imageSrc} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <span className="text-gray-400 text-xs font-light">Image Placeholder</span>
          )}
        </div>

        {/* Price Pill */}
        {price && (
          <div className="bg-[#F0F0F0] text-[#000000] px-4 py-1 rounded-full text-xs font-semibold mb-3 inline-block">
            {price}
          </div>
        )}

        {/* Title */}
        <h4 className="text-base font-semibold text-[#000000] mb-1">{title}</h4>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-gray-500 font-light leading-relaxed">{subtitle}</p>
        )}
      </motion.div>
    );
  }

  if (variant === 'catalog') {
    return (
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        className="bg-white p-4 flex flex-col justify-between items-start border border-gray-300 w-full h-full group"
      >
        {/* Image Placeholder */}
        <div className="bg-[#D9D9D9] w-full aspect-4/3 mb-4 flex items-center justify-center overflow-hidden">
          {imageSrc ? (
            <img src={imageSrc} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <span className="text-gray-400 text-xs font-light">Image Placeholder</span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm md:text-base font-medium text-[#000000] mb-3">{title}</h4>

        {/* Price Pill */}
        {price && (
          <div className="bg-[#F0F0F0] text-[#000000] px-4 py-1 rounded-full text-xs font-medium border border-gray-200">
            {price}
          </div>
        )}
      </motion.div>
    );
  }

  // Standard Product Card (e.g. Just in!)
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25 }}
      className="bg-white p-6 md:p-8 shadow-sm rounded-none relative flex flex-col items-center text-center border border-gray-100/60 w-full"
    >
      {/* Circular "NEW PRODUCT" Badge */}
      {isNew && (
        <div className="absolute -top-4 -left-4 bg-white border border-[#000000] rounded-full w-16 h-16 flex items-center justify-center text-[10px] uppercase font-semibold leading-tight text-center text-[#000000] shadow-xs z-10 p-1">
          {badgeText}
        </div>
      )}

      {/* Image Block Placeholder */}
      <div className="bg-[#D9D9D9] w-full h-48 md:h-52 mb-6 rounded-none flex items-center justify-center overflow-hidden relative group">
        {imageSrc ? (
          <img src={imageSrc} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-gray-400 text-xs font-light">Product Visual</span>
        )}
      </div>

      {/* Product Title */}
      <h3 className="text-xl md:text-2xl font-bold text-[#000000] mb-2">{title}</h3>

      {/* Description */}
      <p className="text-xs md:text-sm text-gray-600 font-light mb-6 max-w-xs leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      <div className="mt-auto">
        <Button variant="primary" size="md" onClick={onActionClick}>
          {actionText}
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
