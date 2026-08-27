import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  const { product, quantity } = item;
  const isMaxStock = quantity >= product.availableStock;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 py-6 border-b border-gray-100 last:border-0 group">
      
      {/* Product Image */}
      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#F6F6F6] rounded-2xl overflow-hidden flex-shrink-0">
        <img 
          src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : ''} 
          alt={product.name}
          className="w-full h-full object-cover mix-blend-multiply"
        />
      </div>

      {/* Product Details */}
      <div className="flex-grow flex flex-col justify-between h-full w-full">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-semibold text-black mb-1">{product.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-1">{product.category?.name}</p>
          </div>
          <button 
            onClick={() => removeFromCart(product.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 -mr-2"
            aria-label="Remove item"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex justify-between items-center mt-4">
          
          {/* Quantity Controls */}
          <div className="flex items-center bg-[#F6F6F6] rounded-full px-1 py-1">
            <button 
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-black hover:bg-white hover:shadow-sm transition-all"
            >
              <Minus size={16} />
            </button>
            
            <span className="w-10 text-center font-medium text-black">
              {quantity}
            </span>
            
            <button 
              onClick={() => updateQuantity(product.id, quantity + 1)}
              disabled={isMaxStock}
              className="w-8 h-8 rounded-full flex items-center justify-center text-black hover:bg-white hover:shadow-sm transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <span className="text-lg font-bold text-black">
              ${(product.price * quantity).toFixed(2)}
            </span>
            {quantity > 1 && (
              <div className="text-xs text-gray-500 mt-1">
                ${product.price.toFixed(2)} each
              </div>
            )}
          </div>
        </div>
        
        {isMaxStock && (
          <p className="text-xs text-amber-600 mt-2">
            Max available stock reached.
          </p>
        )}
      </div>
    </div>
  );
};

export default CartItem;
