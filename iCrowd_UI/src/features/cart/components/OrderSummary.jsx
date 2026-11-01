import React from 'react';
import { ArrowRight, Tag } from 'lucide-react';

const OrderSummary = ({ total, itemCount, onCheckout, disabled = false }) => {
  return (
    <div className="bg-[#F6F6F6] rounded-[32px] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-black mb-6">Order Summary</h2>
      
      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} items)</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="pt-3 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
          <Tag size={13} className="text-gray-400" />
          <span>Promo codes and discounts can be applied at checkout</span>
        </div>
      </div>

      <div className="flex justify-between items-end border-t border-gray-200 pt-6 mb-8">
        <span className="text-lg font-bold text-black">Total</span>
        <div className="text-right">
          <span className="text-3xl font-bold text-black">${total.toFixed(2)}</span>
          <p className="text-xs text-gray-500 mt-1">Including VAT</p>
        </div>
      </div>

      <button 
        onClick={onCheckout}
        disabled={disabled}
        className={`w-full rounded-full py-4 px-6 font-bold text-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98] ${disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
      >
        {disabled ? 'Please remove sold out items' : 'Proceed to Checkout'}
        {!disabled && <ArrowRight size={20} />}
      </button>
    </div>
  );
};

export default OrderSummary;
