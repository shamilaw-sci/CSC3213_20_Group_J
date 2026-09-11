import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Rich interactive card for products suggested by the AI chatbot.
 */
const ProductRecommendationCard = ({ product }) => {
  if (!product) return null;

  const imageUrl = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';

  const categoryName = product.category?.name || product.category || 'Accessory';
  const priceVal = Number(product.price || 0);

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white border border-gray-200/80 hover:border-blue-500 rounded-xl p-2.5 flex gap-3 items-center shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 group relative overflow-hidden"
    >
      {/* Product Image Thumbnail */}
      <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center relative">
        <img
          src={imageUrl}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80';
          }}
        />
        {product.availableStock > 0 && (
          <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[8px] font-bold text-center py-0.2">
            In Stock
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
            {categoryName}
          </span>
          {product.brand && (
            <span className="text-[10px] text-gray-500 font-medium">{product.brand}</span>
          )}
        </div>
        <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {product.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs font-bold text-blue-600 font-mono">
            Rs {priceVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[9px] text-gray-400">1 Yr Warranty</span>
        </div>
      </div>

      {/* Action Arrow */}
      <div className="w-6 h-6 rounded-full bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors text-xs font-bold flex-shrink-0">
        →
      </div>
    </Link>
  );
};

export default ProductRecommendationCard;
