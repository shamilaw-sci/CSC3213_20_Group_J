import React from 'react';
import { useCart } from '../hooks/CartContext.jsx';
import CartItem from '../components/CartItem.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import ProductGrid from '../../products/components/ProductGrid.jsx';
import { useProducts } from '../../products/hooks/useProducts.js';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, AlertTriangle } from 'lucide-react';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, getItemCount } = useCart();
  const { products, loading } = useProducts(); 
  const location = useLocation();

  const suggestedProducts = products.slice(0, 4);
  const navigate = useNavigate();

  // Find if there's a specific product that failed during checkout
  const outOfStockProductId = location.state?.outOfStockProductId;
  const failedItem = outOfStockProductId ? cart.find(i => i.product.id === outOfStockProductId) : null;

  const handleCheckout = () => {
    navigate('/checkout/shipping');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} className="text-gray-300" />
        </div>
        <h1 className="text-4xl font-bold text-black mb-4">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 max-w-md text-center">
          Looks like you haven't added anything to your cart yet. Let's get you back to shopping.
        </p>
        <Link 
          to="/search" 
          className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/20"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-black text-black tracking-tight">Your Cart</h1>
          <span className="bg-black text-white text-sm font-bold px-3 py-1 rounded-full">
            {getItemCount()}
          </span>
        </div>
        <Link 
          to="/search" 
          className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-black font-semibold rounded-full transition-colors"
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </Link>
      </div>

      {failedItem && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-xl shadow-sm flex items-start gap-4">
          <AlertTriangle className="text-red-500 w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-bold text-lg mb-1">Items in your cart sold out!</h3>
            <p className="text-red-700">
              We're sorry, but <span className="font-bold">{failedItem.product.name}</span> sold out while you were checking out. Please remove it from your cart to proceed with the rest of your order.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12 mb-20">
        
        {/* Cart Items List */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-[32px] border border-gray-100 p-2 sm:p-8 shadow-sm">
            {cart.map((item) => (
              <CartItem 
                key={item.product.id} 
                item={item} 
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                isSoldOut={outOfStockProductId === item.product.id}
              />
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="sticky top-24">
            <OrderSummary 
              total={getCartTotal() - (failedItem ? (failedItem.product.price * failedItem.quantity) : 0)} 
              itemCount={getItemCount() - (failedItem ? failedItem.quantity : 0)}
              onCheckout={handleCheckout}
              disabled={!!failedItem}
            />
          </div>
        </div>

      </div>

      {/* Products You May Like */}
      <div className="border-t border-gray-200 pt-16">
        <ProductGrid 
          products={suggestedProducts}
          loading={loading}
          title="Products You May Like"
          subtitle="Complete your loadout with these essentials."
        />
      </div>

    </div>
  );
};

export default CartPage;
