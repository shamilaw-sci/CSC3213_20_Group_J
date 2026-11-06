import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductSlider from '../components/ProductSlider';
import { 
  fetchFeaturedProducts, 
  fetchLatestProducts, 
  fetchRecommendedProducts 
} from '../api/recommendationApi';

const LandingPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadAllSections = async () => {
      setLoading(true);
      try {
        const [featured, latest, recommended] = await Promise.all([
          fetchFeaturedProducts(8),
          fetchLatestProducts(8),
          fetchRecommendedProducts(8),
        ]);

        if (isMounted) {
          setFeaturedProducts(featured || []);
          setLatestProducts(latest || []);
          setRecommendedProducts(recommended || []);
        }
      } catch (err) {
        console.error("Error loading home sections:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAllSections();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full">
      {/* Hero Banner Component */}
      <div className="bg-[#0a0a0a] border-b border-gray-900 pt-32 pb-24 text-center px-4 overflow-hidden relative">
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <div className="w-3/4 h-3/4 bg-white/5 rounded-full blur-[100px]"></div>
        </div>
        
        <h1 className="text-5xl md:text-[80px] font-bold tracking-tight text-white mb-6 leading-none relative z-10">
          Pro, Beyond.
        </h1>
        <p className="text-xl md:text-2xl font-medium tracking-tight text-gray-400 max-w-2xl mx-auto mb-10 relative z-10">
          Flagship smartphones and premium gear curated for the modern digital lifestyle.
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
          {['Smartphone', 'Headset', 'PowerBank', 'Case'].map(cat => (
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

      {/* Suggestion Sections */}
      <div className="max-w-7xl mx-auto px-4 pb-20 space-y-8">
        {/* 1. Featured Products (Highest Sales in Recent Times) */}
        <ProductSlider 
          title="Featured Products"
          subtitle="Top-selling gear and highest sales in recent weeks."
          products={featuredProducts}
          loading={loading}
        />

        {/* 2. Latest Arrivals (Newly Added Products) */}
        <ProductSlider 
          title="Latest Arrivals"
          subtitle="Freshly added gear and newly introduced devices."
          products={latestProducts}
          loading={loading}
        />

        {/* 3. Products You May Like (Personalized based on user purchases/cart + trending fallback) */}
        <ProductSlider 
          title="Products You May Like"
          subtitle="Curated picks personalized for you."
          products={recommendedProducts}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default LandingPage;
