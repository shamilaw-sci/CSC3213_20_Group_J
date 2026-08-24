import React from 'react';

/**
 * PaymentOptionsView Component
 * Displays saved payment methods (cards, digital wallets, cash preferences).
 */
const PaymentOptionsView = () => {
    return (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-base font-bold text-gray-900">My Payment Options</h3>
                    <p className="text-xs text-gray-500">Manage saved cards and checkout payment preferences</p>
                </div>
                <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all shadow-sm cursor-pointer"
                >
                    + Add New Card
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1 */}
                <div className="border border-black rounded-2xl p-5 bg-gradient-to-br from-gray-900 to-black text-white relative shadow-md">
                    <div className="flex items-center justify-between mb-6">
                        <span className="text-xs font-mono font-bold tracking-widest uppercase">VISA</span>
                        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                            PRIMARY
                        </span>
                    </div>
                    <p className="font-mono text-sm tracking-wider mb-4">•••• •••• •••• 4242</p>
                    <div className="flex items-center justify-between text-xs text-gray-300">
                        <span>Cardholder</span>
                        <span>Expires 11/28</span>
                    </div>
                </div>

                {/* Cash on Delivery option */}
                <div className="border border-gray-200 rounded-2xl p-5 flex flex-col justify-between bg-gray-50/50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">💵</span>
                            <h4 className="font-bold text-xs text-gray-900">Cash on Delivery (COD)</h4>
                        </div>
                        <p className="text-xs text-gray-500">
                            Enabled for all eligible islandwide delivery addresses across Sri Lanka.
                        </p>
                    </div>
                    <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs text-emerald-600 font-semibold">
                        <span>Status: Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentOptionsView;
