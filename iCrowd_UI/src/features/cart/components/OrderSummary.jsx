import React from 'react';
import { ArrowRight } from 'lucide-react';
import PromoPicker from './PromoPicker';
import { useCart } from '../hooks/cartState';
import { formatLkr } from '../../../lib/currency';

const OrderSummary = ({ total, itemCount, onCheckout, disabled = false }) => {
  const { promo, promoBusy } = useCart();
  const discount = Number(promo?.discountAmount || 0);
  return (
    <div className="bg-[#F6F6F6] rounded-[32px] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-black mb-6">Order Summary</h2>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} items)</span>
          <span>{formatLkr(total)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span className="text-gray-600 font-medium">Calculated at checkout</span>
        </div>
        <PromoPicker total={total} />
        {discount > 0 && <div className="flex justify-between gap-3 text-emerald-700"><span>Discount</span><span>− {formatLkr(discount)}</span></div>}
      </div>

      <div className="flex justify-between items-end border-t border-gray-200 pt-6 mb-8">
        <span className="text-lg font-bold text-black">Subtotal</span>
        <div className="text-right">
          <span className="text-2xl font-bold text-black">{formatLkr(total - discount)}</span>
          <p className="text-xs text-gray-500 mt-1">Shipping added at checkout</p>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={disabled || promoBusy}
        className={`w-full rounded-full py-4 px-6 font-bold text-lg flex items-center justify-center gap-2 transition-colors active:scale-[0.98] ${disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}
      >
        {promoBusy ? 'Checking promotion…' : disabled ? 'Resolve cart issues to continue' : 'Proceed to Checkout'}
        {!disabled && <ArrowRight size={20} />}
      </button>
    </div>
  );
};

export default OrderSummary;
