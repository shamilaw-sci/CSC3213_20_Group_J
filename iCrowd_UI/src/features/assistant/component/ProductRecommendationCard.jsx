import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Rich interactive card for products suggested by the AI chatbot.
 */
const ProductRecommendationCard = ({ product }) => {
  if (!product) return null;

  const imageUrl = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80';

  const categoryName = product.category?.name || product.category || 'Device';

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white border border-gray-200 hover:border-blue-500 rounded-xl p-2.5 flex gap-3 items-center shadow-sm hover:shadow-md cursor-pointer transition-all group"
    >
      <div className="w-13 h-13 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={product.name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80';
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
            {categoryName}
          </span>
          {product.brand && (
            <span className="text-[10px] text-gray-500 font-medium">{product.brand}</span>
          )}
        </div>
        <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {product.name}
        </p>
        <p className="text-xs font-bold text-blue-600 font-mono">
          Rs {Number(product.price || 0).toLocaleString()}
        </p>
      </div>

      <div className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all text-xs font-bold pr-1">
        →
      </div>
    </Link>
  );
};

export default ProductRecommendationCard;
