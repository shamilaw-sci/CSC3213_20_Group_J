import React, { useState } from 'react';
import { downloadOrderReceipt } from '../api/adminOrderApi';

const formatCurrency = (val) =>
    val != null ? `LKR ${parseFloat(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
        return new Date(isoString).toLocaleString('en-LK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return isoString;
    }
};

const getStatusBadge = (status) => {
    const badges = {
        PENDING_PAYMENT: 'bg-amber-100 text-amber-800 border-amber-200',
        CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
        PROCESSING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        SHIPPED: 'bg-purple-100 text-purple-800 border-purple-200',
        DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        COMPLETED: 'bg-green-100 text-green-800 border-green-200',
        CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
        FAILED: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${badges[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
            {status || 'UNKNOWN'}
        </span>
    );
};

const getPaymentBadge = (status) => {
    const badges = {
        SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        DUE_ON_DELIVERY: 'bg-amber-50 text-amber-700 border-amber-200',
        PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
        INITIATED: 'bg-blue-50 text-blue-700 border-blue-200',
        FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
        CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
    };
    return (
        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${badges[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {status || 'PENDING'}
        </span>
    );
};

const OrderDetailModal = ({ isOpen, order, onClose, onOpenFulfillment }) => {
    const [receiptError, setReceiptError] = useState('');
    const [downloadingReceipt, setDownloadingReceipt] = useState(false);
    const handleReceipt = async () => {
        setReceiptError('');
        setDownloadingReceipt(true);
        try { await downloadOrderReceipt(order.id); }
        catch { setReceiptError('The receipt could not be downloaded. Please try again.'); }
        finally { setDownloadingReceipt(false); }
    };
    if (!isOpen || !order) return null;

    const hasMapCoords = order.shippingLat != null && order.shippingLng != null;
    const mapUrl = hasMapCoords
        ? `https://www.google.com/maps?q=${order.shippingLat},${order.shippingLng}`
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 transition-all">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-gray-900">
                                {order.orderReference || `Order #${order.id}`}
                            </h2>
                            {getStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Placed on {formatDate(order.createdAt)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                onClose();
                                onOpenFulfillment(order);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gray-950 rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Update Status
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Customer & Shipping Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer Info */}
                        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Customer Details</span>
                            <p className="text-sm font-bold text-gray-900">{order.customerName || 'N/A'}</p>
                            <p className="text-xs text-gray-600 mt-1">{order.customerEmail || '—'}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{order.customerPhone || '—'}</p>
                        </div>

                        {/* Shipping Info */}
                        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Shipping Details</span>
                            <p className="text-xs font-semibold text-gray-900">{order.shippingAddress || '—'}</p>
                            <p className="text-xs text-gray-600 mt-0.5">District: <span className="font-medium text-gray-900">{order.shippingDistrict || '—'}</span></p>
                            <p className="text-xs text-gray-600 mt-0.5">
                                Delivery: <span className="font-semibold text-gray-900">{order.deliveryType === 'FAST' ? 'Fast Delivery (1-2 Days)' : 'Standard Delivery (3-5 Days)'}</span>
                            </p>
                            {mapUrl && (
                                <a
                                    href={mapUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2 hover:underline"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    View on Google Maps
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Payment Method</span>
                            <span className="text-sm font-bold text-gray-900">
                                {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : order.paymentMethod === 'ONLINE_BANK_TRANSFER' ? 'Bank Transfer' : 'Card Payment'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Payment Status</span>
                            {getPaymentBadge(order.paymentStatus)}
                        </div>
                        {order.receiptUrl && (
                            <div>
                                <button
                                    type="button"
                                    onClick={handleReceipt}
                                    disabled={downloadingReceipt}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                                >
                                    {downloadingReceipt ? 'Downloading…' : 'Download Uploaded Receipt'}
                                </button>
                                {receiptError && <p role="alert" className="text-xs text-red-600">{receiptError}</p>}
                            </div>
                        )}
                    </div>

                    {/* Ordered Items Table */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            Ordered Items ({order.items?.length || 0})
                        </h4>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100">
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Price</th>
                                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items?.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.productName}
                                                            className="w-10 h-10 object-cover rounded-xl border border-gray-100 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 shrink-0 text-xs">
                                                            IMG
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-gray-900 leading-tight">{item.productName}</p>
                                                        {item.sku && <p className="text-[11px] text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-700 font-semibold">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-4 py-3 text-right text-gray-900 font-bold">{formatCurrency(item.lineTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="border-t border-gray-100 pt-4 flex flex-col items-end space-y-1.5 text-sm">
                        <div className="flex justify-between w-64 text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subTotal)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between w-64 text-emerald-600">
                                <span>Discount</span>
                                <span>- {formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between w-64 text-gray-600">
                            <span>Shipping</span>
                            <span>{formatCurrency(order.shippingCost)}</span>
                        </div>
                        <div className="flex justify-between w-64 pt-2 border-t border-gray-200 text-base font-black text-gray-900">
                            <span>Total</span>
                            <span>{formatCurrency(order.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
