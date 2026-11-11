import React from 'react';
import { CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../features/cart/hooks/CartContext';

const BuyNowButton = ({ product, className = '' }) => {
  const navigate = useNavigate();
  const { addToCart, isProductInCart, cartLoading, cartReady } = useCart();
  const unavailable = !product || !(product.availableStock > 0) || cartLoading || !cartReady;
  const handleBuyNow = () => {
    if (unavailable) return;
    if (!isProductInCart(product.id)) addToCart(product);
    navigate('/checkout/shipping');
  };

  return (
    <button
      type="button"
      onClick={handleBuyNow}
      disabled={unavailable}
      // Removed the corrupted "\f" character and correctly merged the custom className
      className={`disabled:opacity-50 disabled:cursor-not-allowed flex-1 bg-primary hover:bg-primary-hover text-white px-6 py-4 rounded-2xl font-bold transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2 ${className}`}
    >
      <CreditCard className="w-5 h-5" />
      Buy Now
    </button>
  );
};

export default BuyNowButton;