import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../cart/hooks/CartContext';
import { CreditCard, Banknote, Building2, UploadCloud, CheckCircle2, Tag, X, Loader2, Sparkles } from 'lucide-react';
import { createCheckoutOrder, uploadBankReceipt, validatePromoCode, getAvailablePromoCodes } from '../api/checkoutApi';

const PaymentPage = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [checkoutData, setCheckoutData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoStatus, setPromoStatus] = useState('idle'); // idle | checking | valid | invalid
  const [promoData, setPromoData] = useState(null); // PromoValidationResponse
  const [availablePromos, setAvailablePromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('checkoutData');
    if (!savedData) {
      navigate('/checkout/shipping');
      return;
    }
    setCheckoutData(JSON.parse(savedData));
  }, [navigate]);

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

  const subTotal = getCartTotal();
  const shippingCost = checkoutData.deliveryType === 'FAST' ? 500 : 200;
  const discountAmount = promoData?.discountAmount ?? 0;
  const total = subTotal - discountAmount + shippingCost;

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
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
    if (paymentMethod === 'BANK_TRANSFER' && !file) {
      setError("Please upload your bank transfer receipt.");
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // 1. Create the order (include promoCode if a valid one was applied)
      const orderPayload = {
        ...checkoutData,
        paymentMethod,
        promoCode: promoStatus === 'valid' ? promoInput.trim().toUpperCase() : null,
      };

      const orderResponse = await createCheckoutOrder(orderPayload);
      const orderId = orderResponse.id;

      // 2. If Bank Transfer, upload the receipt
      if (paymentMethod === 'BANK_TRANSFER' && file) {
        await uploadBankReceipt(orderId, file);
      }

      // 3. Success
      clearCart();
      localStorage.removeItem('checkoutData');
      
      navigate('/checkout/success', { 
        state: { 
          orderId,
          total,
          method: paymentMethod,
          email: checkoutData.shippingEmail
        }
      });

    } catch (err) {
      console.error(err);
      
      if (err.response?.status === 409 && err.response?.data?.error === 'OUT_OF_STOCK') {
          const failedProductId = err.response.data.productId;
          navigate('/cart', {
              state: { outOfStockProductId: failedProductId }
          });
          return;
      }

      const errorMsg = err.response?.data?.message || err.message || "An unexpected error occurred.";
      navigate('/checkout/error', { state: { message: errorMsg } });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* Left: Payment Options */}
      <div className="md:w-2/3">
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-200 mb-6 font-medium">
            {error}
          </div>
        )}

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm mb-6">
          <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
          
          <div className="space-y-4">
            
            {/* Card Option */}
            <label className={`cursor-pointer border-2 rounded-2xl p-4 block transition-all ${paymentMethod === 'CARD' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center gap-4 mb-4">
                <input type="radio" name="payment" value="CARD" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} className="accent-black w-4 h-4" />
                <div className="flex items-center gap-2 font-bold text-black">
                  <CreditCard size={20} /> Credit / Debit Card
                </div>
              </div>
              
              {paymentMethod === 'CARD' && (
                <div className="ml-8 p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                  {/* Fake Card Form */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Card Number</label>
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                      <input type="text" placeholder="MM/YY" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">CVC</label>
                      <input type="text" placeholder="123" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><CheckCircle2 size={12}/> Secure 256-bit SSL encryption</p>
                </div>
              )}
            </label>

            {/* Bank Transfer Option */}
            <label className={`cursor-pointer border-2 rounded-2xl p-4 block transition-all ${paymentMethod === 'BANK_TRANSFER' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center gap-4">
                <input type="radio" name="payment" value="BANK_TRANSFER" checked={paymentMethod === 'BANK_TRANSFER'} onChange={() => setPaymentMethod('BANK_TRANSFER')} className="accent-black w-4 h-4" />
                <div className="flex items-center gap-2 font-bold text-black">
                  <Building2 size={20} /> Bank Transfer
                </div>
              </div>

              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="ml-8 mt-4 p-4 bg-white rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">
                    Please transfer the total amount to the following account:
                    <br/><br/>
                    <strong>Bank:</strong> Commercial Bank<br/>
                    <strong>Account Name:</strong> iCrowd Retail<br/>
                    <strong>Account No:</strong> 1234567890<br/>
                    <strong>Branch:</strong> Colombo 01
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-black transition-colors cursor-pointer relative">
                    <input type="file" onChange={handleFileChange} accept="image/*,.pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <UploadCloud size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-black">
                        {file ? file.name : 'Upload Transfer Receipt'}
                      </span>
                      {!file && <span className="text-xs text-gray-500 mt-1">PNG, JPG or PDF</span>}
                    </div>
                  </div>
                </div>
              )}
            </label>

            {/* COD Option */}
            <label className={`cursor-pointer border-2 rounded-2xl p-4 block transition-all ${paymentMethod === 'COD' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-center gap-4">
                <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="accent-black w-4 h-4" />
                <div className="flex items-center gap-2 font-bold text-black">
                  <Banknote size={20} /> Cash on Delivery
                </div>
              </div>
            </label>

          </div>
        </div>
      </div>

      {/* Right: Final Summary */}
      <div className="md:w-1/3">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm sticky top-6">
          <h2 className="text-xl font-bold mb-6">Final Order Summary</h2>
          
          <div className="border-b border-gray-100 pb-4 space-y-3 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping cost</span>
              <span>Rs. {shippingCost.toFixed(2)}</span>
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
            <span className="font-bold text-black">Total to pay</span>
            <span className="text-2xl font-black text-black">Rs. {total.toFixed(2)}</span>
          </div>

          <button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98] disabled:bg-gray-400 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {isProcessing ? 'Processing...' : `Pay Rs. ${total.toFixed(2)}`}
          </button>
        </div>
      </div>

    </div>
  );
};

export default PaymentPage;
