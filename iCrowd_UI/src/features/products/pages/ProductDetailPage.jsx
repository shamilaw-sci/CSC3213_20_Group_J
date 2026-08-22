import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductDetail } from '../hooks/useProductDetail';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/ProductGrid';
import { Star } from 'lucide-react';

import ProductImageGallery from '../components/ProductImageGallery';
import ProductFeatures from '../components/ProductFeatures';
import ProductSpecs from '../components/ProductSpecs';
import AddToCartButton from '../../../components/ui/AddToCartButton';
import BuyNowButton from '../../../components/ui/BuyNowButton';
import ReviewSection from '../../review/components/ReviewSection';

const ProductDetailPage = () => {
  const { id } = useParams();
  
  const { product, loading, error } = useProductDetail(id);
  
  const { products: allProducts } = useProducts(); 
  const suggestedProducts = allProducts
    .filter(p => p.id !== Number(id))
    .slice(0, 4);

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
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center text-amber-500 bg-amber-50 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 fill-current mr-1" />
              <span className="font-bold">{product.averageRating?.toFixed(1) || "0.0"}</span>
            </div>
            <a href="#reviews" className="text-gray-500 hover:text-black font-medium transition-colors">
              {product.reviewCount || 0} Reviews
            </a>
          </div>
          
          <p className="text-gray-700 font-medium leading-relaxed mb-8">
            {product.description}
          </p>

          <p className="text-4xl font-black text-black mb-8">
            Rs. {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-3 h-3 rounded-full ${product.availableStock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 font-bold">
              {product.availableStock > 0 ? `${product.availableStock} in stock` : 'Out of stock'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full mb-4">
            <AddToCartButton productId={product.id} className="shadow-sm" />
            <BuyNowButton productId={product.id} />
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

      {/* 2. Product Feedback / Reviews */}
      <ReviewSection productId={product.id} />

      {/* 3. Product Grid (Reused for Suggestions!) */}
      <ProductGrid 
        products={suggestedProducts} 
        title="You Might Also Like"
      />

    </div>
  );
};

export default ProductDetailPage;
