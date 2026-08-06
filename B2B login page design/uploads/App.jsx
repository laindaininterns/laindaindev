import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategorySection from './components/CategorySection';
import JustInSection from './components/JustInSection';
import SubscriptionSection from './components/SubscriptionSection';
import BestsellersSection from './components/BestsellersSection';
import CategoryPage from './components/CategoryPage';
import ProductDetailPage from './components/ProductDetailPage';
import ShoppingBagPage from './components/ShoppingBagPage';
import CartOverviewPage from './components/CartOverviewPage';
import Footer from './components/Footer';

function App() {
  const [activePage, setActivePage] = useState('home'); // 'home' | 'shop' | 'product' | 'bag' | 'checkout'
  const [selectedProduct, setSelectedProduct] = useState({
    title: 'Green Tea',
    category: 'Loose leaf tea',
    tagline: 'Strong & Energizing',
    rating: 5,
    reviewCount: 483,
    description:
      'This tea is known for its strong, robust flavor and its refreshing, invigorating aroma. It is a popular choice for those who enjoy a bold, full-bodied tea experience. Gunpowder Green tea is also believed to have a number of health benefits including aiding in digestion and boosting the immune system. Try it hot or iced for a tasty and healthy beverage choice.',
    price: '$31',
    imageSrc: null,
  });

  const [cartItem, setCartItem] = useState({
    title: 'Green Tea',
    variant: 'Packed Bags',
    quantity: 1,
    price: '$31',
  });

  const handleNavigate = (page, itemData) => {
    if (itemData) {
      setCartItem((prev) => ({
        ...prev,
        title: itemData.title || prev.title,
        variant: itemData.variant || prev.variant,
        quantity: itemData.quantity || prev.quantity,
        price: itemData.price || prev.price,
      }));
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product) => {
    if (product) {
      setSelectedProduct((prev) => ({
        ...prev,
        ...product,
        category: product.subtitle || product.category || 'Loose leaf tea',
      }));
    }
    setActivePage('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCartQuantity = (newQty) => {
    setCartItem((prev) => ({ ...prev, quantity: newQty }));
  };

  const handleRemoveCartItem = () => {
    setCartItem({
      title: 'Green Tea',
      variant: 'Packed Bags',
      quantity: 0,
      price: '$0',
    });
  };

  return (
    <div className="min-h-screen bg-[#FDF9F6] text-[#000000] font-poppins flex flex-col antialiased">
      {/* 1. Navbar Component */}
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        cartCount={cartItem.quantity}
      />

      {/* 2. Main Content View */}
      <main className="flex-1">
        {activePage === 'home' && (
          <>
            {/* Landing Page Content */}
            <Hero />
            <CategorySection onSelectCategory={() => handleNavigate('shop')} />
            <JustInSection onActionClick={() => handleSelectProduct({ title: 'Green Tea', price: '$31' })} />
            <SubscriptionSection />
            <BestsellersSection />
          </>
        )}

        {activePage === 'shop' && (
          <CategoryPage onSelectProduct={handleSelectProduct} />
        )}

        {activePage === 'product' && (
          <ProductDetailPage
            product={selectedProduct}
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {activePage === 'bag' && (
          <ShoppingBagPage
            cartItem={cartItem}
            onNavigate={handleNavigate}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
          />
        )}

        {activePage === 'checkout' && (
          <CartOverviewPage
            cartItem={cartItem}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* 3. Footer Component */}
      <Footer />
    </div>
  );
}

export default App;
