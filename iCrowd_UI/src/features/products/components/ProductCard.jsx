import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const isOutOfStock = product.availableStock === 0;

  return (
    <div className="group relative bg-[#F6F6F6] rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] flex flex-col h-full border border-gray-100">
      
      {/* Clickable Area (Image + Info) */}
      <Link to={`/product/${product.id}`} className="flex flex-col flex-grow outline-none">
        
        {/* Top Badges */}
        <div className="absolute top-5 left-5 right-5 flex justify-between z-10 pointer-events-none">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
            {product.category?.name || 'Category'}
          </span>
          {isOutOfStock ? (
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
              Sold Out
            </span>
          ) : product.availableStock < 20 ? (
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
              Low Stock
            </span>
          ) : null}
        </div>

        {/* Product Image */}
        <div className="aspect-square w-full overflow-hidden bg-gray-50 relative mt-0">
          <img 
            src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : ''} 
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${isOutOfStock ? 'opacity-40 grayscale' : ''}`}
          />
        </div>

        {/* Product Details */}
        <div className="px-6 pt-6 pb-2 flex flex-col text-center min-h-[120px]">
          <h3 className="text-xl font-semibold text-black mb-2 line-clamp-2 transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-gray-700 font-medium line-clamp-2 mt-auto mb-4">
            {product.description}
          </p>
        </div>
      </Link>
      
      {/* Card Footer (Price + Button) */}
      <div className="px-6 pb-6 flex items-center justify-between mt-auto">
        <span className="text-2xl font-semibold tracking-tight text-black">
          ${product.price.toFixed(2)}
        </span>
        
        <button 
          disabled={isOutOfStock}
          className="relative z-20 bg-black hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-full transition-all active:scale-95 shadow-md hover:shadow-lg"
          onClick={(e) => {
            console.log(`Added ${product.name} to cart`);
          }}
        >
          {isOutOfStock ? 'Sold Out' : 'Add'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
