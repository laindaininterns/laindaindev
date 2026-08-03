import React, { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ activePage = 'home', onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Shop', id: 'shop' },
    { name: 'Subscribe', id: 'subscribe' },
    { name: 'About', id: 'about' },
  ];

  const handleNavClick = (id) => {
    if (onNavigate) {
      if (id === 'shop') {
        onNavigate('shop');
      } else {
        onNavigate('home');
      }
    }
    setIsMobileMenuOpen(false);
  };

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
          {/* Logo Button */}
          <button 
            onClick={() => handleNavClick('home')}
            className="inline-block cursor-pointer focus:outline-none"
          >
            <div className="w-24 h-12 bg-white border border-gray-300 flex items-center justify-center text-sm font-semibold tracking-wider text-[#000000] shadow-xs hover:border-black transition-colors">
              Logo
            </div>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => {
              const isActive = (link.id === 'shop' && activePage === 'shop') || (link.id === 'home' && activePage === 'home');
              return (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.id)}
                  className={`text-lg font-normal text-[#000000] hover:text-[#A3C1BF] transition-colors relative py-1 cursor-pointer focus:outline-none ${
                    isActive ? 'font-medium' : ''
                  }`}
                >
                  {link.name}
                  {/* Underline for Active Item (matching Figma Category page for Shop) */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#000000]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
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
              <button
                key={link.name}
                onClick={() => handleNavClick(link.id)}
                className="block text-left w-full text-lg font-medium text-[#000000] hover:text-[#A3C1BF]"
              >
                {link.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
