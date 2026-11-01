import React, { useState, useEffect } from 'react';
import { getAvailablePromoCodes } from '../../checkout/api/checkoutApi';

/**
 * PromotionsCard Component
 * Displays promotions/offers available to the logged-in customer.
 */
const PromotionsCard = () => {
    const [copiedCode, setCopiedCode] = useState(null);
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        getAvailablePromoCodes()
            .then(data => {
                if (!isMounted) return;
                if (data && data.length > 0) {
                    const formatted = data.map(p => ({
                        code: p.code,
                        discount: p.discountType === 'PERCENTAGE' 
                            ? `${p.discountValue}% OFF` 
                            : `LKR ${Number(p.discountValue).toLocaleString()} OFF`,
                        title: p.customerEligibility === 'NEW_CUSTOMERS' 
                            ? 'New Customer Exclusive' 
                            : 'Special Offer',
                        description: p.minimumOrderAmount 
                            ? `Valid on orders above LKR ${Number(p.minimumOrderAmount).toLocaleString()}` 
                            : 'Valid on storewide items.',
                        expires: p.expiryDate ? `Valid until ${p.expiryDate}` : 'No expiration',
                        badge: p.customerEligibility === 'NEW_CUSTOMERS' ? 'Welcome Gift' : 'Special Offer'
                    }));
                    setPromos(formatted);
                } else {
                    setPromos([]);
                }
            })
            .catch(() => {
                if (isMounted) setPromos([]);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false; };
    }, []);

    const copyToClipboard = (code) => {
        navigator.clipboard?.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2500);
    };

    return (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Promotions & Vouchers</h3>
                    <p className="text-xs text-gray-500">Exclusive discount coupons for your account</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {promos.length} Active {promos.length === 1 ? 'Offer' : 'Offers'}
                </span>
            </div>

            {/* Promo Vouchers Grid */}
            {loading ? (
                <div className="text-xs text-gray-400 py-6 text-center">Loading promotions...</div>
            ) : promos.length === 0 ? (
                <div className="text-xs text-gray-400 py-6 text-center">No active promo codes right now. Check back soon!</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promos.map((promo) => (
                        <div
                            key={promo.code}
                            className="border border-dashed border-gray-300 rounded-xl p-4 bg-gradient-to-r from-gray-50/70 to-white flex flex-col justify-between relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded mb-1">
                                        {promo.badge}
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-900">{promo.discount}</h4>
                                    <p className="text-xs font-medium text-gray-700">{promo.title}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(promo.code)}
                                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                        copiedCode === promo.code
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-black text-white hover:bg-gray-800'
                                    }`}
                                >
                                    {copiedCode === promo.code ? 'Copied!' : promo.code}
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{promo.description}</p>

                            <div className="text-[11px] text-gray-400 font-medium pt-2 border-t border-gray-100">
                                {promo.expires}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PromotionsCard;
