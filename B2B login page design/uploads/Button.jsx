import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  onClick, 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 focus:outline-none cursor-pointer';
  
  const variants = {
    primary: 'bg-[#2D3030] text-[#FDF9F6] hover:bg-[#000000] shadow-sm',
    secondary: 'bg-[#A3C1BF] text-[#000000] hover:bg-[#8EAFA semi-bold]',
    outline: 'border border-white/80 text-[#FDF9F6] bg-transparent hover:bg-white hover:text-[#000000]',
    darkOutline: 'border border-black text-[#000000] bg-transparent hover:bg-black hover:text-white',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-8 py-2.5 text-sm',
    lg: 'px-10 py-3.5 text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
