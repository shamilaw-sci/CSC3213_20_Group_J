import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductSlider from '../components/ProductSlider';
import StorefrontHero from '../components/StorefrontHero';
import { defaultHero } from '../heroConfig';
import { apiClient } from '../../../lib/axios';
import { 
  fetchFeaturedProducts, 
  fetchLatestProducts, 
  fetchRecommendedProducts 
} from '../api/recommendationApi';

const LandingPage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [hero, setHero] = useState(defaultHero);
  const [categories, setCategories] = useState([]);
  const [categoryStatus, setCategoryStatus] = useState('loading');
  useEffect(() => {
    let active = true;
    apiClient.get('/categories').then(({ data }) => {
      if (active) { setCategories(data); setCategoryStatus('loaded'); }
    }).catch(() => { if (active) setCategoryStatus('error'); });
    apiClient.get('/storefront/hero').then(({ data }) => { if (active) setHero(data); }).catch(() => {});
    return () => { active = false; };
  }, []);
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
      <StorefrontHero hero={hero}/>

      {/* Categories Bar */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 text-center">
          Browse by Category
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          {categoryStatus === 'loading' && <p role="status" className="text-sm text-slate-500">Loading categories…</p>}
          {categoryStatus === 'error' && <p role="status" className="text-sm text-slate-600">Categories could not be loaded. <Link to="/search" className="underline">Browse all products</Link></p>}
          {categoryStatus === 'loaded' && categories.length === 0 && <Link to="/search" className="underline">Browse all products</Link>}
          {categories.map(cat => (
            <Link 
              key={cat.id}
              to={`/search?category=${encodeURIComponent(cat.name)}`}
              className="bg-white border border-gray-300 hover:border-black text-black px-8 py-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 font-medium"
            >
              {cat.name}
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
