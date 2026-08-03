import React, { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Shop', href: '#shop' },
    { name: 'Subscribe', href: '#subscribe' },
    { name: 'About', href: '#about' },
  ];

  return (
    <header className="w-full sticky top-0 z-50 bg-[#FDF9F6]">
      {/* Top Banner */}
      <div className="bg-[#000000] text-[#FDF9F6] text-xs font-semibold py-2.5 px-4 text-center tracking-wide">
        For free shipping on orders over $100 and more use code FREESHIPPINGYAY
      </div>

      {/* Main Navbar */}
      <nav className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between border-b border-gray-200/40">
        {/* Left: Logo and Nav Links */}
        <div className="flex items-center space-x-8 md:space-x-12">
          {/* Logo Placeholder */}
          <a href="#" className="inline-block">
            <div className="w-24 h-12 bg-white border border-gray-300 flex items-center justify-center text-sm font-semibold tracking-wider text-[#000000] shadow-xs hover:border-black transition-colors">
              Logo
            </div>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-lg font-normal text-[#000000] hover:text-[#A3C1BF] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Right: Search Bar & Mobile Menu Trigger */}
        <div className="flex items-center space-x-4">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-4 h-4 text-gray-700 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product"
              className="pl-8 pr-3 py-1.5 border border-[#000000] bg-transparent text-xs md:text-sm text-[#000000] placeholder-gray-600 w-44 sm:w-64 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#000000] focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#FDF9F6] border-b border-gray-200 px-6 py-4 space-y-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-lg font-medium text-[#000000] hover:text-[#A3C1BF]"
              >
                {link.name}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
