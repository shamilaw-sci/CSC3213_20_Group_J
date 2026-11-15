import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useProductDetail } from '../hooks/useProductDetail';
import ProductSlider from '../components/ProductSlider';
import { fetchSimilarProducts, trackProductView } from '../api/recommendationApi';
import FrequentlyBoughtTogether from '../components/FrequentlyBoughtTogether';
import RecentlyViewedSection from '../components/RecentlyViewedSection';
import { Star } from 'lucide-react';
import ReviewSection from '../../review/components/ReviewSection';
import QuestionSection from '../../review/components/QuestionSection';

import ProductImageGallery from '../components/ProductImageGallery';
import ProductFeatures from '../components/ProductFeatures';
import ProductSpecs from '../components/ProductSpecs';
import AddToCartButton from '../../../components/ui/AddToCartButton';
import BuyNowButton from '../../../components/ui/BuyNowButton';

const ProductDetailContent = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const promo = searchParams.get('promo')?.slice(0, 50);
  
  const { product, loading, error, refresh } = useProductDetail(id);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    fetchSimilarProducts(id, 8)
      .then((data) => {
        if (isMounted) setSimilarProducts(data || []);
      })
      .catch((err) => {
        console.error("Error loading similar products:", err);
      })
      .finally(() => {
        if (isMounted) setSimilarLoading(false);
      });

    // Telemetry: Track user product view
    let sessionId = localStorage.getItem('icrowd_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('icrowd_session_id', sessionId);
    }
    trackProductView(id, sessionId, 'VIEW');

    return () => { isMounted = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center p-10 bg-red-500/10 rounded-2xl border border-red-500/20 max-w-2xl mx-auto my-20">
        <h2 className="text-red-400 text-xl font-bold mb-2">Oops!</h2>
        <p className="text-red-200">{error || "Product not found."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      
      {promo && <div className="mb-6 border border-amber-200 bg-amber-50 p-4 rounded-xl">
        Offer code: <strong>{promo}</strong>. Enter this code at checkout. Eligibility, minimum spend and expiry conditions apply; the discount is confirmed at checkout.
      </div>}
      {/* 1. Product Description Component */}
      <div className="flex flex-col lg:flex-row gap-12 mb-12 bg-[#F6F6F6] p-6 md:p-12 rounded-[32px]">
        
        {/* Left: Image Gallery */}
        <div className="lg:w-1/2">
          <ProductImageGallery images={product.imageUrls} />
        </div>

        {/* Right: Details */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          
          {/* Brand & Tags */}
          <div className="mb-4">
            {product.brand ? (
              <span className="inline-block text-primary font-bold tracking-widest uppercase text-sm mb-2">
                {product.brand}
              </span>
            ) : (
              <Link to={`/search?category=${encodeURIComponent(product.category?.name || '')}`} className="inline-block text-black font-bold tracking-widest uppercase text-sm mb-2 hover:underline">
                {product.category?.name || 'Category'}
              </Link>
            )}
            
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 mt-2">
                {product.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white text-xs font-semibold text-gray-500 rounded-full border border-gray-200">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tight">
            {product.name}
          </h1>

          {/* Static Review Stars */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-5 h-5 ${star <= Math.round(product.averageRating || 0) ? "fill-current" : "text-gray-300"}`} />
              ))}
            </div>
            <span className="text-black font-bold text-lg">{product.reviewCount ? Number(product.averageRating).toFixed(1) : "Not rated"}</span>
            <span className="text-gray-500 font-medium text-sm">({product.reviewCount || 0} reviews)</span>
          </div>
          
          <p className="text-gray-700 font-medium leading-relaxed mb-8">
            {product.description}
          </p>

          <p className="text-4xl font-black text-black mb-8">
            LKR {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-3 h-3 rounded-full ${product.availableStock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 font-bold">
              {product.availableStock > 0 ? `${product.availableStock} in stock` : 'Out of stock'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full mb-4">
            <AddToCartButton product={product} className="shadow-sm" />
            <BuyNowButton product={product} />
          </div>

          <ProductFeatures 
            features={product.features}
            warranty={product.warranty}
            deliveryInfo={product.deliveryInfo}
          />

        </div>
      </div>

      {/* 2. Technical Specifications */}
      <ProductSpecs specifications={product.specifications} />

      {/* AI Frequently Bought Together Bundle */}
      <FrequentlyBoughtTogether productId={id} />

      <ReviewSection key={'reviews-' + id} productId={id} onChanged={refresh} />
      <QuestionSection key={'questions-' + id} productId={id} />

      {/* 3. Product Slider for Similar Suggestions */}
      <ProductSlider 
        products={similarProducts} 
        loading={similarLoading}
        title="You May Also Like"
        subtitle="Related products matched to this item and your taste."
      />

      {/* 4. AI Browsing History: Recently Viewed Products */}
      <RecentlyViewedSection currentProductId={id} />

    </div>
  );
};

export default function ProductDetailPage() { const { id } = useParams(); return <ProductDetailContent key={id}/>; }
