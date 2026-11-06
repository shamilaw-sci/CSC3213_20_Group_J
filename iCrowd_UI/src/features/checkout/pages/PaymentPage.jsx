import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../cart/hooks/CartContext';
import { CreditCard, Banknote, ShieldCheck, Tag, X, CheckCircle2, AlertCircle, Loader2, Sparkles, Building2, UploadCloud } from 'lucide-react';
import { createOrder, initiatePayment, submitPayHereCheckout, validatePromoCode, getAvailablePromoCodes, createCheckoutOrder, uploadBankReceipt } from '../api/checkoutApi';

const PaymentPage = () => {
  const { getCartTotal, removeFromCart } = useCart();
  const navigate = useNavigate();
  
  const [checkoutData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('checkoutData') || 'null'); }
    catch { return null; }
  });
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // Card via PayHere, or COD
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState('idle'); // idle | checking | valid | invalid
  const [promoData, setPromoData] = useState(null); // PromoValidationResponse
  const [availablePromos, setAvailablePromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);

  useEffect(() => {
    if (!checkoutData) navigate('/checkout/shipping');
  }, [navigate, checkoutData]);

  useEffect(() => {
    let isMounted = true;
    setLoadingPromos(true);
    getAvailablePromoCodes()
      .then(data => {
        if (isMounted) setAvailablePromos(data || []);
      })
      .catch(err => {
        console.error("Error fetching available promotions:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingPromos(false);
      });
    return () => { isMounted = false; };
  }, []);

  if (!checkoutData) return null;

  // Prioritize server-validated pricing values saved from the ShippingPage
  const subTotal = checkoutData.subTotal != null ? Number(checkoutData.subTotal) : getCartTotal();
  const shippingCost = checkoutData.shippingCost != null ? Number(checkoutData.shippingCost) : (checkoutData.deliveryType === 'FAST' ? 500 : 200);
  const discount = checkoutData.discount != null ? Number(checkoutData.discount) : 0;
  const discountAmount = Number(promoData?.discountAmount ?? 0);
  const total = subTotal - (promoStatus === 'valid' ? discountAmount : discount) + shippingCost;

  // Requirement 13: Dynamic button label based on payment method
  const getButtonLabel = () => {
    if (isProcessing) return 'Processing Order...';
    switch (paymentMethod) {
      case 'CARD':
        return `Pay with Card  â€¢  Rs. ${total.toFixed(2)}`;
      case 'COD':
        return 'Confirm Order (Cash on Delivery)';
      default:
        return `Pay Rs. ${total.toFixed(2)}`;
    }
  };

  // ── Promo code handlers ──────────────────────────────────────────────────────

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoStatus('checking');
    setPromoData(null);
    try {
      const result = await validatePromoCode(code, subTotal);
      if (result.valid) {
        setPromoStatus('valid');
        setPromoData(result);
      } else {
        setPromoStatus('invalid');
        setPromoData(result);
      }
    } catch {
      setPromoStatus('invalid');
      setPromoData({ message: 'Could not validate promo code. Please try again.' });
    }
  };

  const handleSelectPromo = async (code) => {
    setPromoInput(code);
    setPromoStatus('checking');
    setPromoData(null);
    try {
      const result = await validatePromoCode(code, subTotal);
      if (result.valid) {
        setPromoStatus('valid');
        setPromoData(result);
      } else {
        setPromoStatus('invalid');
        setPromoData(result);
      }
    } catch {
      setPromoStatus('invalid');
      setPromoData({ message: 'Could not validate promo code. Please try again.' });
    }
  };

  const handleRemovePromo = () => {
    setPromoInput('');
    setPromoStatus('idle');
    setPromoData(null);
  };

  // ── Checkout handler ─────────────────────────────────────────────────────────

  const handlePayment = async () => {
    // Requirement 14: Validate payment method selected
    if (!paymentMethod) {
      setError("Please select a payment method to continue.");
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // 1. Prepare order payload for POST /api/orders
      const stored = JSON.parse(localStorage.getItem('checkoutData') || '{}');
      const checkoutKey = stored.checkoutKey || crypto.randomUUID();
      localStorage.setItem('checkoutData', JSON.stringify({ ...checkoutData, checkoutKey }));
      const orderPayload = {
        checkoutKey,
        promoCode: promoStatus === 'valid' ? promoInput.trim().toUpperCase() : null,
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
        localStorage.removeItem('checkoutData');

        navigate('/cart', { state: { checkoutMessage: 'Sorry, ' + (apiErr.productName || 'an item') + ' just sold out. We removed it from your cart; your other items are still here.' } });
      } else if (apiErr?.message) {
        setError(apiErr.message);
      } else {
        setError("An error occurred while creating your order. Please try again.");
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left: Payment Method Selection */}
      <div className="md:w-2/3">
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Select Payment Method
            </h2>
            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              Secure checkout
            </span>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm mb-6 border border-red-200 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Option 1: Credit / Debit Card */}
            <label
              className={`cursor-pointer border-2 rounded-2xl p-5 block transition-all ${
                paymentMethod === 'CARD'
                  ? 'border-black bg-gray-50/70 shadow-sm ring-1 ring-black/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <input
                  type="radio"
                  name="payment"
                  value="CARD"
                  checked={paymentMethod === 'CARD'}
                  onChange={() => setPaymentMethod('CARD')}
                  className="accent-black w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2.5 font-bold text-black text-base">
                  <CreditCard size={20} /> Credit or Debit Card
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <span>Visa</span> â€¢ <span>Mastercard</span>
                </div>
              </div>

              {paymentMethod === 'CARD' && (
                <div className="mt-4 pt-4 border-t border-gray-200/80 text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">PayHere Checkout</p>
                  <p className="text-xs text-gray-500">
                    You will be securely redirected to PayHere to authenticate your card.
                    No sensitive card numbers or CVVs are ever stored on our servers.
                  </p>
                </div>
              )}
            </label>

            {/* Option 3: Cash on Delivery (COD) */}
            <label
              className={`cursor-pointer border-2 rounded-2xl p-5 block transition-all ${
                paymentMethod === 'COD'
                  ? 'border-black bg-gray-50/70 shadow-sm ring-1 ring-black/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="accent-black w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2.5 font-bold text-black text-base">
                  <Banknote size={20} /> Cash on Delivery (COD)
                </div>
                <div className="ml-auto text-xs text-gray-400 font-medium">
                  Pay at Doorstep
                </div>
              </div>

              {paymentMethod === 'COD' && (
                <div className="mt-4 pt-4 border-t border-gray-200/80 text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">Pay on Handover</p>
                  <p className="text-xs text-gray-500">
                    Pay the total amount in cash directly to our courier agent when your package is delivered.
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Right: Final Order Summary (Requirement 12) */}
      <div className="md:w-1/3">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm sticky top-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Final Summary</h2>
            <span className="text-[11px] font-bold uppercase bg-black text-white px-2.5 py-0.5 rounded-full">
              {paymentMethod === 'CARD' ? 'Card' : 'COD'}
            </span>
          </div>

          <div className="border-b border-gray-100 pb-4 space-y-3 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">Rs. {subTotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-700 font-medium">
                <span>Promotional Discount</span>
                <span>- Rs. {discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping ({checkoutData.deliveryType || 'STANDARD'})</span>
              <span className="font-medium text-gray-900">Rs. {shippingCost.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>Selected Method</span>
              <span className="font-semibold text-black">
                {paymentMethod === 'CARD' ? 'Credit/Debit Card' : 'Cash on Delivery'}
              </span>
            </div>
            {promoStatus === 'valid' && discountAmount > 0 && (
              <div className="flex justify-between text-sm font-medium text-green-600">
                <span className="flex items-center gap-1">
                  <Tag size={13} /> Promo ({promoData.promoCode})
                </span>
                <span>- Rs. {Number(discountAmount).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Promo Code Input & Available Coupons */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Tag size={13} className="text-gray-400" /> Promo Code
              </label>
              {availablePromos.length > 0 && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                  {availablePromos.length} offer{availablePromos.length > 1 ? 's' : ''} available
                </span>
              )}
            </div>

            {promoStatus !== 'valid' ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoStatus('idle'); setPromoData(null); }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                    placeholder="Enter code"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoStatus === 'checking' || !promoInput.trim()}
                    className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all disabled:bg-gray-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    {promoStatus === 'checking' ? <Loader2 size={14} className="animate-spin" /> : null}
                    Apply
                  </button>
                </div>
                {promoStatus === 'invalid' && promoData?.message && (
                  <p className="text-xs text-red-500">{promoData.message}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3 mb-2">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 size={16} />
                  <div>
                    <div className="text-sm font-bold">{promoData.promoCode}</div>
                    <div className="text-xs text-green-600">{promoData.message}</div>
                  </div>
                </div>
                <button 
                  onClick={handleRemovePromo} 
                  title="Remove coupon"
                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Available Promotions List */}
            {availablePromos.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-500" />
                    Available Promotions
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">Tap to apply</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {availablePromos.map((promo) => {
                    const isSelected = promoStatus === 'valid' && promoData?.promoCode?.toUpperCase() === promo.code?.toUpperCase();
                    const discountText = promo.discountType === 'PERCENTAGE'
                      ? `${promo.discountValue}% OFF${promo.maxDiscountAmount ? ` (Up to Rs. ${promo.maxDiscountAmount})` : ''}`
                      : `Rs. ${promo.discountValue} OFF`;

                    return (
                      <div
                        key={promo.id || promo.code}
                        onClick={() => !isSelected && handleSelectPromo(promo.code)}
                        className={`group border rounded-xl p-2.5 transition-all text-left flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300'
                            : 'bg-gray-50/60 border-gray-200 hover:border-black hover:bg-white cursor-pointer'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-2xs">
                              {promo.code}
                            </span>
                            <span className="text-xs font-bold text-emerald-600">
                              {discountText}
                            </span>
                          </div>
                          {promo.minimumOrderAmount && Number(promo.minimumOrderAmount) > 0 && (
                            <p className="text-[11px] text-gray-500 mt-1 truncate">
                              Min. order: Rs. {Number(promo.minimumOrderAmount).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div>
                          {isSelected ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                              Applied ✓
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPromo(promo.code);
                              }}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors cursor-pointer"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="font-bold text-black block">Total Payable</span>
              <span className="text-xs text-gray-500">Net order total (LKR)</span>
            </div>
            <span className="text-2xl font-black text-black">
              Rs. {total.toFixed(2)}
            </span>
          </div>

          {/* Requirement 13: Dynamic button label */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98] disabled:bg-gray-400 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{getButtonLabel()}</span>
              </>
            ) : (
              <span>{getButtonLabel()}</span>
            )}
          </button>

          <p className="text-[11px] text-gray-400 text-center mt-3">
            By continuing, you agree to our terms of service and order fulfillment policies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
