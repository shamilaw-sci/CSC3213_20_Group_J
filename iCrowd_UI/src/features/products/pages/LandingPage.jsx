import React from 'react';
import ProductGrid from '../components/ProductGrid';
import { useProducts } from '../hooks/useProducts';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  // Fetch products (for now, fetching all active products)
  const { products, loading, error } = useProducts();

  return (
    <div className="w-full">
      {/* Hero Banner Component */}
      <div className="bg-[#0a0a0a] border-b border-gray-900 pt-32 pb-24 text-center px-4 overflow-hidden relative">
        {/* Subtle glow effect behind text */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <div className="w-3/4 h-3/4 bg-white/5 rounded-full blur-[100px]"></div>
        </div>
        
        <h1 className="text-5xl md:text-[80px] font-bold tracking-tight text-white mb-6 leading-none relative z-10">
          Pro, Beyond.
        </h1>
        <p className="text-xl md:text-2xl font-medium tracking-tight text-gray-400 max-w-2xl mx-auto mb-10 relative z-10">
          Premium mobile accessories curated for the modern lifestyle.
        </p>
        <Link to="/search" className="inline-block bg-white hover:scale-105 text-black font-semibold py-4 px-12 rounded-full transition-all text-lg shadow-xl relative z-10 active:scale-95">
          Shop Now
        </Link>
      </div>

      {/* Categories Bar */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 text-center">
          Browse by Category
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          {['Headset', 'PowerBank', 'Case'].map(cat => (
            <Link 
              key={cat} 
              to={`/search?category=${cat}`}
              className="bg-white border border-gray-300 hover:border-black text-black px-8 py-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 font-medium"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products using our highly reusable ProductGrid! */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <ProductGrid 
          products={products.slice(0, 4)} // Just show top 4 featured
          loading={loading}
          error={error}
          title="Featured Accessories"
          subtitle="Hand-picked essentials for your devices."
        />
      </div>
    </div>
  );
};

export default LandingPage;
