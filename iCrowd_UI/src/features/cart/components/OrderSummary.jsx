import React from 'react';
import { ArrowRight } from 'lucide-react';

const OrderSummary = ({ total, itemCount, onCheckout }) => {
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
        
        {/* Placeholder for promotions */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Gift card or discount code</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter code" 
              className="flex-grow bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black transition-colors"
            />
            <button className="bg-gray-200 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors">
              Apply
            </button>
          </div>
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
        className="w-full bg-black text-white rounded-full py-4 px-6 font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors active:scale-[0.98]"
      >
        Proceed to Checkout
        <ArrowRight size={20} />
      </button>
    </div>
  );
};

export default OrderSummary;
