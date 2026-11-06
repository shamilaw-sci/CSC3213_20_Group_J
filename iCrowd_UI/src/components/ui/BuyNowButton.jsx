import React from 'react';
import { CreditCard } from 'lucide-react';

const BuyNowButton = ({ productId, className = '' }) => {
  const handleBuyNow = () => {
    // Fixed the string format to properly include the productId
    console.log(`Proceeding to checkout for product ${productId}`);
  };

  return (
    <button
      type="button"
      onClick={handleBuyNow}
      // Removed the corrupted "\f" character and correctly merged the custom className
      className={`flex-1 bg-primary hover:bg-primary-hover text-white px-6 py-4 rounded-2xl font-bold transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2 ${className}`}
    >
      <CreditCard className="w-5 h-5" />
      Buy Now
    </button>
  );
};

export default BuyNowButton;