import React from 'react';
import { ShoppingCart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../features/cart/hooks/cartState';
import { Link } from 'react-router-dom';

const AddToCartButton = ({ product, className = '' }) => {
  const { addToCart, isProductInCart, cartLoading, cartReady } = useCart();
  
  if (!product) return null;

  const inCart = isProductInCart(product.id);
  const isOutOfStock = !(product.availableStock > 0);

  if (inCart) {
    return (
      <Link
        to="/cart"
        className={`flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${className}`}
      >
        <ShoppingBag className="w-5 h-5 animate-in zoom-in" />
        In Cart (View)
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={isOutOfStock || cartLoading || !cartReady}
      onClick={() => addToCart(product)}
      className={`flex-1 ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-white'} px-6 py-4 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 ${className}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
    </button>
  );
};

export default AddToCartButton;