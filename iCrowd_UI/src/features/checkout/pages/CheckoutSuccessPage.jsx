import SwitchToCodButton from '../components/SwitchToCodButton';
import { useCart } from '../../cart/hooks/cartState';
import React, { useState, useEffect, useEffectEvent } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Mail, Package, CreditCard, Loader2, AlertTriangle, RefreshCw, ShieldCheck, MapPin } from 'lucide-react';
import { getPaymentStatus, initiatePayment, submitPayHereCheckout } from '../api/checkoutApi';

const CheckoutSuccessPage = () => {
  const { removeFromCart, completeCheckout } = useCart();
  const finishCart = useEffectEvent((id,items) => completeCheckout(id,items));
  const removeUnavailable = useEffectEvent(id => removeFromCart(id));
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const queryOrderId = searchParams.get('orderId');
  const stateOrderId = location.state?.orderId;
  const targetOrderId = queryOrderId || stateOrderId;

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(Boolean(targetOrderId));
  const [pollCount, setPollCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!targetOrderId) return;

    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const data = await getPaymentStatus(targetOrderId);
        if (!isMounted) return;

        setOrderData(data);
        if (data.orderStatus === 'STOCK_UNAVAILABLE') {
          if (data.unavailableProductId) removeUnavailable(data.unavailableProductId);
          sessionStorage.removeItem('checkoutData');
          setLoading(false);
          return;
        }
        if (data.paymentStatus === 'SUCCESS' || data.paymentStatus === 'DUE_ON_DELIVERY') {
          finishCart(data.orderId, data.items || []);
          sessionStorage.removeItem('checkoutData');
        }

        // If status is still INITIATED or PENDING, poll a few times
        const isPending = data.paymentStatus === 'INITIATED' || data.paymentStatus === 'PENDING';
        if (isPending && pollCount < 4) {
          setTimeout(() => {
            if (isMounted) setPollCount((prev) => prev + 1);
          }, 2000);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load payment status:", err);
        if (isMounted) {
          setErrorMsg(err.response?.data?.message || "Could not retrieve order verification.");
          setLoading(false);
        }
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [targetOrderId, pollCount]);

  // Handle safe payment retry without creating duplicate orders (Requirement 18 & 56)
  const handleRetryPayment = async (method = 'CARD') => {
    setIsRetrying(true);
    try {
      const session = await initiatePayment(targetOrderId, method);
      submitPayHereCheckout(session);
    } catch (err) {
      console.error("Retry payment error:", err);
      setErrorMsg("Failed to initiate payment retry. Please try again or contact support.");
      setIsRetrying(false);
    }
  };

  if (!targetOrderId && !location.state) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <p className="text-gray-500 mb-4">No active order information found.</p>
        <Link to="/search" className="inline-block bg-black text-white px-6 py-3 rounded-full text-sm font-bold">
          Continue Shopping
        </Link>
      </div>
    );
  }

  // Requirement 54: Pending verification screen
  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Loader2 size={32} className="animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          We are checking your payment. This may take a moment.
        </p>
      </div>
    );
  }

  if (['CHARGEBACK','REVIEW_REQUIRED','REFUND_PENDING','REFUNDED'].includes(orderData?.paymentStatus) &&
      !(orderData?.orderStatus === 'STOCK_UNAVAILABLE' && ['REFUND_PENDING', 'REFUNDED'].includes(orderData?.paymentStatus))) return <div className="max-w-xl mx-auto py-16 px-4 text-center">
    <h1 className="text-2xl font-bold">{{CHARGEBACK:'Payment disputed',REVIEW_REQUIRED:'Payment under review',REFUND_PENDING:'Refund in progress',REFUNDED:'Payment refunded'}[orderData.paymentStatus]}</h1>
    <p className="my-4">Order {orderData.orderReference || targetOrderId}. {orderData.paymentStatus==='REVIEW_REQUIRED' ? 'Support is checking the payment. Please wait for confirmation before trying to pay again.' : 'Contact support if you need help with this payment.'}</p>
    <button onClick={() => setPollCount(count => count+1)} className="border rounded-xl p-3">Check status</button><Link className="block mt-4 underline" to="/profile">View orders</Link>
  </div>;

  const isConfirmed = orderData?.paymentStatus === 'SUCCESS' ||
                      orderData?.paymentStatus === 'DUE_ON_DELIVERY' ||
                      orderData?.orderStatus === 'CONFIRMED' ||
                      orderData?.orderStatus === 'PROCESSING';

  const isFailed = orderData?.paymentStatus === 'FAILED' ||
                   orderData?.paymentStatus === 'CANCELLED' ||
                   orderData?.orderStatus === 'FAILED';

  if (orderData?.orderStatus === 'STOCK_UNAVAILABLE') {
    return <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <h1 className="text-2xl font-bold">Item unavailable â€” refund status</h1>
      <p className="my-4">Order #{orderData.orderReference || targetOrderId}: {orderData.unavailableProductName || 'An item'} sold out and was removed from your cart.</p>
      <p role="status">{orderData.paymentStatus === 'REFUNDED' ? 'Your payment has been refunded.' : 'Your refund is pending. Check again for an update.'}</p>
      {errorMsg && <p role="alert">{errorMsg}</p>}
      <button onClick={() => { setErrorMsg(''); setLoading(true); setPollCount(count => count + 1); }} className="my-4 bg-black text-white px-6 py-3 rounded-xl">Check refund status</button>
      <Link className="block underline" to="/cart">Return to cart</Link>
    </div>;
  }

  // Requirement 55 & 56: If payment failed after return
  if (isFailed) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Payment Was Not Completed</h1>
        <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
          Your order <strong className="text-black">#{orderData?.orderReference || targetOrderId}</strong> was created, but the payment transaction was declined or cancelled.
        </p>

        {errorMsg && (
          <div className="bg-rose-50 text-rose-800 text-xs p-4 rounded-2xl mb-6 max-w-md mx-auto border border-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <button
            onClick={() => handleRetryPayment('CARD')}
            disabled={isRetrying}
            className="bg-black text-white px-6 py-3.5 rounded-full font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isRetrying ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>Retry Card Payment</span>
          </button>
            <SwitchToCodButton orderId={targetOrderId} disabled={isRetrying} />


        </div>
      </div>
    );
  }

  if (!isConfirmed) {
    return <div className="max-w-xl mx-auto py-16 text-center">
      <h1 className="text-2xl font-bold">Payment confirmation pending</h1>
      <p className="my-4">{errorMsg || 'We are still checking with the bank. Your order is not confirmed yet.'}</p>
      <button onClick={() => { setLoading(true); setPollCount(count => count + 1); }} className="bg-black text-white px-6 py-3 rounded-xl">Check again</button>
      <Link className="block mt-4" to="/cart">Return to cart</Link>
    </div>;
  }

  // Requirement 53: Confirmed order display
  const displayRef = orderData?.orderReference || location.state?.orderReference || `ORD-${targetOrderId}`;
  const displayTotal = orderData?.totalAmount != null ? Number(orderData.totalAmount) : (location.state?.total || 0);
  const displayMethod = orderData?.paymentMethod || location.state?.method || 'CARD';

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
        <CheckCircle2 size={44} className="text-emerald-600" />
      </div>

      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-3">
        <ShieldCheck size={14} /> Order received
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-black mb-2 tracking-tight">Order Confirmed!</h1>
      <p className="text-gray-500 text-sm sm:text-base mb-8">
        Thank you for your purchase. Your order reference is <span className="font-bold text-black font-mono">#{displayRef}</span>
      </p>

      <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-gray-100 shadow-sm text-left mb-8 space-y-5">
        {/* Email note */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
            <Mail size={18} />
          </div>
          <div>
            <h3 className="font-bold text-black text-sm mb-0.5">Confirmation Details</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              You can view your order and check its progress in My Orders.
            </p>
          </div>
        </div>

        {/* Order Status */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-600">
            <Package size={18} />
          </div>
          <div>
            <h3 className="font-bold text-black text-sm mb-0.5">What happens next</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {displayMethod === 'COD'
                ? 'Your order is confirmed. Please have cash ready when your delivery arrives.'
                : 'Payment received. We will prepare your items for delivery.'}
            </p>
            {orderData?.estimatedDelivery && (
              <p className="text-xs font-semibold text-gray-800 mt-1">
                Estimated Delivery: {orderData.estimatedDelivery}
              </p>
            )}
          </div>
        </div>

        {/* Shipping address preview if available */}
        {orderData?.shippingAddress && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-700">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="font-bold text-black text-sm mb-0.5">Delivery Destination</h3>
              <p className="text-xs text-gray-600">
                {orderData.shippingFullName}, {orderData.shippingAddress}, {orderData.shippingDistrict}
              </p>
            </div>
          </div>
        )}

        {/* Payment Amount */}
        <div className="flex items-start gap-4 pt-2 border-t border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600">
            <CreditCard size={18} />
          </div>
          <div className="flex-grow min-w-0 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-black text-sm mb-0.5">
                {displayMethod === 'COD' ? 'Amount Due on Delivery' : 'Total Amount Paid'}
              </h3>
              <p className="text-xs text-gray-500 uppercase font-medium">
                Method: {displayMethod === 'COD' ? 'Cash on Delivery' : displayMethod === 'BANK_TRANSFER' ? 'Online Bank Transfer' : 'Credit/Debit Card'}
              </p>
            </div>
            <span className="font-black text-xl text-black">LKR {displayTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/profile?tab=orders"
          className="bg-black text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-gray-800 transition-all shadow-md active:scale-95"
        >
          View My Orders
        </Link>
        <Link
          to="/search"
          className="bg-gray-100 text-gray-800 px-8 py-4 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
