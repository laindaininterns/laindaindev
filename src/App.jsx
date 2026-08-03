import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategorySection from './components/CategorySection';
import JustInSection from './components/JustInSection';
import SubscriptionSection from './components/SubscriptionSection';
import BestsellersSection from './components/BestsellersSection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[#FDF9F6] text-[#000000] font-poppins flex flex-col antialiased">
      {/* 1. Navbar Component */}
      <Navbar />

      {/* 2. Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Category Features (3 columns) */}
        <CategorySection />

        {/* Just In Section */}
        <JustInSection />

        {/* Subscription / Membership Section */}
        <SubscriptionSection />

        {/* Bestsellers Section */}
        <BestsellersSection />
      </main>

      {/* 3. Footer Component */}
      <Footer />
    </div>
  );
}

export default App;
