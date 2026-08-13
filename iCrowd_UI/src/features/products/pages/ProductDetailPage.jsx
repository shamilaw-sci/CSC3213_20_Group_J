import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductDetail } from '../hooks/useProductDetail';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/ProductGrid';

const ProductDetailPage = () => {
  const { id } = useParams();
  
  // 1. Fetch the main product
  const { product, loading, error } = useProductDetail(id);
  
  // 2. Fetch all products to pick some "suggestions"
  // In a real app, we might have a specific endpoint for related products!
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
      <div className="flex flex-col md:flex-row gap-12 mb-20 bg-[#F6F6F6] p-6 md:p-12 rounded-[32px]">
        
        {/* Left: Image */}
        <div className="lg:w-1/2">
          <div className="aspect-square bg-white rounded-[32px] overflow-hidden shadow-sm relative">
            <img 
              src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : ''} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            
            {/* Gallery thumbnails could go here later if we want to display multiple images */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {product.imageUrls.map((url, i) => (
                   <div key={i} className="w-12 h-12 rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                     <img src={url} className="w-full h-full object-cover" />
                   </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          {/* Category & Tags */}
          <div className="mb-4">
            <Link to={`/search?category=${encodeURIComponent(product.category?.name || '')}`} className="inline-block text-black font-bold tracking-widest uppercase text-sm mb-2 hover:underline">
              {product.category?.name || 'Category'}
            </Link>
            
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
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
          
          <p className="text-2xl font-bold text-black mb-6">
            ${product.price.toFixed(2)}
          </p>
          
          <p className="text-gray-700 font-medium leading-relaxed mb-10">
            {product.description}
          </p>

          <div className="flex items-center gap-4 mb-6">
            <div className={`w-3 h-3 rounded-full ${product.availableStock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 font-bold">
              {product.availableStock > 0 ? `${product.availableStock} in stock` : 'Out of stock'}
            </span>
          </div>

          <button 
            disabled={product.availableStock === 0}
            className="w-full md:w-auto bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-12 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 text-lg"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* 2. Product Feedback / Reviews (Dummy Component) */}
      <div className="mb-20 bg-[#F6F6F6] p-8 md:p-12 rounded-[32px]">
        <h3 className="text-2xl font-bold text-black mb-6">Customer Feedback</h3>
        <p className="text-gray-500 font-medium italic">No reviews yet. Be the first to review this product!</p>
      </div>

      {/* 3. Product Grid (Reused for Suggestions!) */}
      <ProductGrid 
        products={suggestedProducts} 
        title="You Might Also Like"
      />

    </div>
  );
};

export default ProductDetailPage;
