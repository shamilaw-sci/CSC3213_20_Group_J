import SwitchToCodButton from '../components/SwitchToCodButton';
import React, { useState } from 'react';
import { useLocation, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RefreshCw, Loader2, CreditCard, Building2 } from 'lucide-react';
import { initiatePayment, submitPayHereCheckout } from '../api/checkoutApi';

const CheckoutErrorPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryOrderId = searchParams.get('orderId');
  const stateOrderId = location.state?.orderId;
  const orderId = queryOrderId || stateOrderId;

  const errorMessages = { cancelled: 'Payment was cancelled. You can check your order or try again.', declined: 'Payment was declined. Please check your payment details or choose another method.' };
  const errorMessage = errorMessages[searchParams.get('code')] || 'Payment could not be completed. Check your order status before trying again.';
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');

  const handleRetryPayment = async (method = 'CARD') => {
    if (!orderId) {
      navigate('/checkout/shipping');
      return;
    }

    setIsRetrying(true);
    setRetryError('');

    try {
      const session = await initiatePayment(orderId, method);
      submitPayHereCheckout(session);
    } catch (err) {
      console.error("Retry payment error:", err);
      setRetryError(err.response?.data?.message || "Could not restart payment. Please return to the cart.");
      setIsRetrying(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-sm">
        <AlertTriangle size={40} />
      </div>

      <h1 className="text-3xl font-black text-black mb-3 tracking-tight">Payment Unsuccessful</h1>

      <div className="bg-rose-50 text-rose-800 p-5 rounded-2xl border border-rose-200 mb-6 text-sm font-medium leading-relaxed">
        {errorMessage}
      </div>

      {retryError && (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 text-xs mb-6 font-medium">
          {retryError}
        </div>
      )}

      {/* Requirement 56: Safe payment retry buttons if order ID exists */}
      {orderId && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6 text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Safe Retry (Order #{orderId})
          </p>
          <p className="text-xs text-gray-600 mb-4">
            Your cart items and delivery information are preserved. You can retry paying without creating duplicate orders.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={isRetrying}
              onClick={() => handleRetryPayment('CARD')}
              className="flex-1 bg-black text-white py-3 px-4 rounded-xl font-bold text-xs hover:bg-gray-800 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isRetrying ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={15} />}
              <span>Retry Card Payment</span>
            </button>
            <SwitchToCodButton orderId={orderId} disabled={isRetrying} />


          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => navigate('/checkout/shipping')}
          className="bg-gray-100 text-black px-6 py-3.5 rounded-full font-bold text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Review Shipping Info</span>
        </button>

        <Link
          to="/cart"
          className="bg-gray-900 text-white px-6 py-3.5 rounded-full font-bold text-xs hover:bg-black transition-colors shadow-md"
        >
          Return to Cart
        </Link>
      </div>
    </div>
  );
};

export default CheckoutErrorPage;
