import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCart } from '../../cart/hooks/cartState';
import { CreditCard, Banknote, ShieldCheck, Tag, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatLkr } from '../../../lib/currency';
import { createOrder, initiatePayment, submitPayHereCheckout, validatePromoCode } from '../api/checkoutApi';

const PaymentPage = () => {
  const { getCartTotal, removeFromCart, applyPromo, removePromo } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [checkoutData] = useState(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem('checkoutData') || 'null');
      return data?.owner === String(user.id || user.email) && Array.isArray(data.items) && data.items.length ? data : null;
    }
    catch { return null; }
  });
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // Card via PayHere, or COD
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Promo code state
  const [promoInput, setPromoInput] = useState(checkoutData?.promoCode || '');
  const [promoStatus, setPromoStatus] = useState(checkoutData?.promoCode ? 'valid' : 'idle'); // idle | checking | valid | invalid
  const promoRequest = useRef(0);
  const processing = useRef(false);
  const [promoData, setPromoData] = useState(checkoutData?.promoCode ? { promoCode: checkoutData.promoCode, discountAmount: checkoutData.discount } : null); // PromoValidationResponse

  useEffect(() => {
    if (!checkoutData) navigate('/checkout/shipping');
  }, [navigate, checkoutData]);

  if (!checkoutData) return null;

  // Prioritize server-validated pricing values saved from the ShippingPage
  const subTotal = checkoutData.subTotal != null ? Number(checkoutData.subTotal) : getCartTotal();
  const shippingCost = checkoutData.shippingCost != null ? Number(checkoutData.shippingCost) : (checkoutData.deliveryType === 'FAST' ? 500 : 200);
  const discount = 0;
  const discountAmount = Number(promoData?.discountAmount ?? 0);
  const total = subTotal - (promoStatus === 'valid' ? discountAmount : discount) + shippingCost;

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code || promoStatus === 'checking' || processing.current) return;
    const request = ++promoRequest.current;
    setPromoStatus('checking');
    setPromoData(null);
    try {
      const result = await validatePromoCode(code, subTotal);
      if (request !== promoRequest.current) return;
      if (result.valid) {
        setPromoStatus('valid');
        applyPromo(code);
        const stored = JSON.parse(sessionStorage.getItem('checkoutData') || '{}');
        sessionStorage.setItem('checkoutData', JSON.stringify({ ...stored, promoCode: code, discount: result.discountAmount }));
        sessionStorage.setItem(`iCrowd_promo:${user.id || user.email}`, code);
        setPromoData({ ...result, promoCode: code });
      } else {
        setPromoStatus('invalid');
        setPromoData({ ...result, promoCode: code });
      }
    } catch {
      if (request !== promoRequest.current) return;
      setPromoStatus('invalid');
      setPromoData({ message: 'Could not validate promo code. Please try again.' });
    }
  };

  const handleRemovePromo = () => {
    if (processing.current) return;
    promoRequest.current += 1;
    removePromo();
    sessionStorage.removeItem(`iCrowd_promo:${user.id || user.email}`);
    const stored = JSON.parse(sessionStorage.getItem('checkoutData') || '{}');
    sessionStorage.setItem('checkoutData', JSON.stringify({ ...stored, promoCode: null, discount: 0 }));
    setPromoInput('');
    setPromoStatus('idle');
    setPromoData(null);
  };

  // â”€â”€ Checkout handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handlePayment = async () => {
    if (processing.current || promoStatus === 'checking') return;
    // Requirement 14: Validate payment method selected
    if (!paymentMethod) {
      setError("Please select a payment method to continue.");
      return;
    }

    processing.current = true;
    setIsProcessing(true);
    setError('');

    try {
      // 1. Prepare order payload for POST /api/orders
      const stored = JSON.parse(sessionStorage.getItem('checkoutData') || '{}');
      const checkoutKey = stored.checkoutKey || crypto.randomUUID();
      sessionStorage.setItem('checkoutData', JSON.stringify({ ...checkoutData, checkoutKey, promoCode: promoStatus === 'valid' ? promoData.promoCode : null, discount: promoStatus === 'valid' ? discountAmount : 0 }));
      const orderPayload = {
        checkoutKey,
        promoCode: promoStatus === 'valid' ? promoData.promoCode : null,
        shippingFullName: checkoutData.shippingFullName,
        shippingPhone: checkoutData.shippingPhone,
        shippingEmail: checkoutData.shippingEmail,
        shippingAddress: checkoutData.shippingAddress,
        shippingDistrict: checkoutData.shippingDistrict,
        shippingLat: checkoutData.shippingLat,
        shippingLng: checkoutData.shippingLng,
        deliveryType: checkoutData.deliveryType,
        paymentMethod: paymentMethod,
        items: checkoutData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      // 2. Create the order on the backend (Phase 4)
      const orderResponse = await createOrder(orderPayload);
      const orderId = orderResponse.orderId;
      const orderReference = orderResponse.orderReference;

      // 3. Flow branch based on payment method
      if (paymentMethod === 'COD') {
        // Cash on delivery: Order is immediately CONFIRMED / DUE_ON_DELIVERY


        navigate(`/checkout/success?orderId=${orderId}`, {
          state: {
            orderId: orderId,
            orderReference: orderReference,
            total: total,
            method: 'COD',
            email: checkoutData.shippingEmail
          }
        });
      } else {
        // Create a signed PayHere checkout request
        const gatewaySession = await initiatePayment(orderId, paymentMethod);




        submitPayHereCheckout(gatewaySession);
      }
    } catch (err) {
      console.error("Order / Payment processing error:", err);
      const apiErr = err.response?.data;
      if (apiErr?.error === 'OUT_OF_STOCK') {
        removeFromCart(apiErr.productId);
        sessionStorage.removeItem('checkoutData');

        navigate('/cart', { state: { checkoutMessage: 'Sorry, ' + (apiErr.productName || 'an item') + ' just sold out. We removed it from your cart; your other items are still here.' } });
      } else if (apiErr?.message) {
        setError(apiErr.message);
      } else {
        setError("An error occurred while creating your order. Please try again.");
      }
      processing.current = false;
      setIsProcessing(false);
    }
  };

  return <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
    <div className="space-y-6 min-w-0">
      <header><p className="text-sm font-semibold text-slate-500">Almost there</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Choose how to pay</h1><p className="mt-3 text-slate-600">Review your delivery details and choose a payment option.</p></header>
      {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <fieldset disabled={isProcessing || promoStatus === 'checking'} className="space-y-3">
        <legend className="sr-only">Payment method</legend>
        {[{ value: 'CARD', title: 'Credit or debit card', detail: 'Continue to PayHere to complete your card payment securely.', icon: <CreditCard size={20}/> }, { value: 'COD', title: 'Cash on delivery', detail: 'Pay the courier in cash when your order arrives.', icon: <Banknote size={20}/> }].map(({ value, title, detail, icon }) => <label key={value} className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 ${paymentMethod === value ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-white'}`}>
          <input type="radio" name="payment" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} className="mt-1.5 accent-slate-900"/>
          <div className="min-w-0 flex-1"><span className="flex items-center gap-2 font-semibold">{icon}{title}</span><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></div>
        </label>)}
      </fieldset>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Deliver to</h2><Link to="/checkout/shipping" className="text-sm font-semibold underline">Edit</Link></div>
        <p className="mt-4 font-medium">{checkoutData.shippingFullName}</p><p className="mt-1 text-sm leading-6 text-slate-600">{checkoutData.shippingAddress}, {checkoutData.shippingDistrict}</p><p className="mt-1 text-sm text-slate-600">{checkoutData.shippingPhone}</p>
        <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">{checkoutData.deliveryType === 'FAST' ? 'Express delivery' : 'Standard delivery'}{checkoutData.estimatedDelivery ? ` · ${checkoutData.estimatedDelivery}` : ''}</p>
      </section>
    </div>
    <aside className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:sticky lg:top-6">
      <h2 className="text-xl font-bold">Your order</h2>
      <ul className="my-5 max-h-60 space-y-4 overflow-y-auto border-b border-slate-100 pb-5">{checkoutData.items.map(item => <li key={item.productId} className="flex justify-between gap-4 text-sm"><span className="min-w-0"><strong className="block">{item.name || 'Product'}</strong><span className="text-slate-500">Quantity {item.quantity}</span></span>{item.price != null && <span className="shrink-0 font-medium">{formatLkr(item.price * item.quantity)}</span>}</li>)}</ul>
      <dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-slate-600">Subtotal</dt><dd className="font-semibold">{formatLkr(subTotal)}</dd></div><div className="flex justify-between gap-3"><dt className="text-slate-600">Delivery</dt><dd className="font-semibold">{formatLkr(shippingCost)}</dd></div>{promoStatus === 'valid' && <div className="flex justify-between gap-3 text-emerald-700"><dt>Discount ({promoData.promoCode})</dt><dd className="font-semibold">− {formatLkr(discountAmount)}</dd></div>}</dl>
      <div className="my-5 border-y border-slate-100 py-5">
        {promoStatus === 'valid' ? <div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 font-semibold text-emerald-700"><Tag size={17}/>{promoData.promoCode} applied</span><button onClick={handleRemovePromo} disabled={isProcessing} aria-label="Remove promo code" className="underline">Remove</button></div> : <div><label htmlFor="promo-code" className="mb-2 block text-sm font-semibold">Promo code</label><div className="flex gap-2"><input id="promo-code" value={promoInput} disabled={isProcessing || promoStatus === 'checking'} onChange={event => { promoRequest.current += 1; setPromoInput(event.target.value.toUpperCase()); setPromoStatus('idle'); setPromoData(null); }} onKeyDown={event => { if (event.key === 'Enter') handleApplyPromo(); }} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Enter code"/><button onClick={handleApplyPromo} disabled={isProcessing || promoStatus === 'checking' || !promoInput.trim()} className="rounded-xl bg-slate-100 px-4 text-sm font-semibold disabled:opacity-50">{promoStatus === 'checking' ? 'Checking…' : 'Apply'}</button></div>{promoStatus === 'invalid' && <p role="alert" className="mt-2 text-sm text-red-700">{promoData?.message}</p>}</div>}
      </div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2"><span className="font-bold">Total</span><strong className="text-2xl tracking-tight">{formatLkr(total)}</strong></div>
      <button onClick={handlePayment} disabled={isProcessing || promoStatus === 'checking'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-4 font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{isProcessing ? <><Loader2 size={18} className="animate-spin"/>Placing your order…</> : paymentMethod === 'CARD' ? 'Pay with Card' : 'Place order · Pay on delivery'}</button>
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck size={15}/>Secure checkout</p>
    </aside>
  </div>;
};

export default PaymentPage;
