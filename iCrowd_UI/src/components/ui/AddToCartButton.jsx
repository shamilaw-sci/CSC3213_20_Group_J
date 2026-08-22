import React from 'react';
import { ShoppingCart } from 'lucide-react';

const AddToCartButton = ({ productId, className = '' }) => {
  const handleAddToCart = () => {
    // Fixed the string format to properly use the productId
    console.log(`Added product ${productId} to cart`);
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      // Removed the corrupted characters and properly appended the custom className
      className={`flex-1 bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 ${className}`}
    >
      <ShoppingCart className="w-5 h-5" />
      Add to Cart
    </button>
  );
};

export default AddToCartButton;