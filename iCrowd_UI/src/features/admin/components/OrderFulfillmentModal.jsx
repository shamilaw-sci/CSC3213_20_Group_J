import React, { useState } from 'react';

const STATUS_OPTIONS = [
    {
        value: 'CONFIRMED',
        label: 'Confirmed',
        desc: 'Order confirmed (COD or payment verified). Ready to prepare.',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    {
        value: 'PROCESSING',
        label: 'Processing / Packing',
        desc: 'Order items are currently being picked and packed at warehouse.',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    {
        value: 'SHIPPED',
        label: 'Dispatched / In Transit',
        desc: 'Handed over to courier service; currently in transit to customer.',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
        value: 'DELIVERED',
        label: 'Delivered',
        desc: 'Package delivered to recipient. (COD payment marked as completed).',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
        value: 'COMPLETED',
        label: 'Completed',
        desc: 'Order fully fulfilled and closed.',
        badgeColor: 'bg-green-100 text-green-800 border-green-200',
    },
    {
        value: 'CANCELLED',
        label: 'Cancelled',
        desc: 'Order cancelled. Only unshipped orders without paid or unresolved payments can be cancelled.',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
];

const OrderFulfillmentModal = ({ isOpen, order, onClose, onUpdateStatus, loading }) => {
    const [selectedStatus, setSelectedStatus] = useState(order?.status || 'PROCESSING');
    const [note, setNote] = useState('');

    if (!isOpen || !order) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdateStatus(order.id, selectedStatus, note);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 transition-all">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Fulfillment Status</span>
                        <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                            Order {order.orderReference || `#${order.id}`}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Customer overview */}
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between text-xs text-gray-600">
                        <div>
                            <span className="block font-semibold text-gray-900 text-sm">{order.customerName || 'Customer'}</span>
                            <span className="text-gray-500">{order.customerPhone} • {order.shippingDistrict}</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-gray-400">Current Status</span>
                            <span className="font-bold text-gray-900">{order.status}</span>
                        </div>
                    </div>

                    {/* Status Options */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Where is this order now?
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {STATUS_OPTIONS.map((opt) => {
                                const isSelected = selectedStatus === opt.value;
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => setSelectedStatus(opt.value)}
                                        className={`cursor-pointer border rounded-2xl p-3 flex items-start gap-3 transition-all ${
                                            isSelected
                                                ? 'border-gray-900 bg-gray-900/5 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        <div className="mt-0.5">
                                            <input
                                                type="radio"
                                                name="fulfillmentStatus"
                                                value={opt.value}
                                                checked={isSelected}
                                                onChange={() => setSelectedStatus(opt.value)}
                                                className="w-4 h-4 text-gray-900 focus:ring-gray-900 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}>
                                                    {opt.value}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Optional Note */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Tracking note / courier reference (saved to audit history)
                        </label>
                        <input
                            type="text"
                            maxLength={500}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Courier tracking #PR12345678"
                            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2.5 text-sm font-semibold text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || selectedStatus === order.status}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gray-950 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md shadow-gray-950/10"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Updating…
                                </>
                            ) : (
                                'Update Status'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderFulfillmentModal;
