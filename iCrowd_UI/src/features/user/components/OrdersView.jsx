import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/axios';

/**
 * OrdersView Component
 * Displays real customer order history, returns, cancellations, and status tracking.
 */
const OrdersView = ({ filterType = 'all' }) => {
    const [selectedTab, setSelectedTab] = useState(
        filterType === 'returns' ? 'returns' : filterType === 'cancellations' ? 'cancellations' : 'all'
    );
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/orders/my-orders');
            if (Array.isArray(res.data)) {
                setOrders(res.data);
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.error("Failed to load customer orders:", err);
            setError(err.response?.data?.message || 'Could not load your orders. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(order => {
        if (selectedTab === 'all') return true;
        if (selectedTab === 'processing') return order.statusCategory === 'processing';
        if (selectedTab === 'delivered') return order.statusCategory === 'delivered';
        if (selectedTab === 'returns') return order.statusCategory === 'returns';
        if (selectedTab === 'cancellations') return order.statusCategory === 'cancellations';
        return true;
    });

    const getStatusBadge = (order) => {
        const cat = order.statusCategory;
        if (cat === 'delivered') {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        if (cat === 'cancellations') {
            return 'bg-red-50 text-red-700 border-red-200';
        }
        if (cat === 'returns') {
            return 'bg-purple-50 text-purple-700 border-purple-200';
        }
        return 'bg-amber-50 text-amber-700 border-amber-200';
    };

    return (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-base font-bold text-gray-900">
                        {filterType === 'returns' ? 'My Returns' : filterType === 'cancellations' ? 'My Cancellations' : 'My Orders'}
                    </h3>
                    <p className="text-xs text-gray-500">Track and view your purchases and delivery status</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto text-xs font-semibold">
                {[
                    { id: 'all', label: `All Orders (${orders.length})` },
                    { id: 'processing', label: `In Transit / Processing (${orders.filter(o => o.statusCategory === 'processing').length})` },
                    { id: 'delivered', label: `Delivered (${orders.filter(o => o.statusCategory === 'delivered').length})` },
                    { id: 'returns', label: `Returns (${orders.filter(o => o.statusCategory === 'returns').length})` },
                    { id: 'cancellations', label: `Cancellations (${orders.filter(o => o.statusCategory === 'cancellations').length})` }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedTab(tab.id)}
                        className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                            selectedTab === tab.id
                                ? 'bg-black text-white shadow-sm'
                                : 'text-gray-500 hover:text-black hover:bg-gray-100'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mb-2"></div>
                    <span className="text-xs text-gray-500">Loading your orders...</span>
                </div>
            ) : error ? (
                <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-red-600 font-medium">{error}</p>
                    <button
                        onClick={fetchOrders}
                        className="px-4 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        📦
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                        {selectedTab === 'returns'
                            ? 'No return requests found'
                            : selectedTab === 'cancellations'
                                ? 'No cancelled orders found'
                                : 'No orders found in this section'}
                    </p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        When you place an order, its details and shipment status will appear right here.
                    </p>
                    <Link
                        to="/products"
                        className="inline-block mt-2 px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-all cursor-pointer"
                    >
                        Explore Products
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="border border-gray-200/80 rounded-xl p-4 hover:border-gray-300 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                                <div>
                                    <span className="font-bold text-gray-900">Order #{order.orderReference}</span>
                                    {order.date && (
                                        <>
                                            <span className="text-gray-400 mx-2">•</span>
                                            <span className="text-gray-500">Placed on {order.date}</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(order)}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            <div className="py-3 space-y-2">
                                {order.items && order.items.length > 0 ? (
                                    order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-3">
                                                {item.imageUrl ? (
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={item.title}
                                                        className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                                                        🛍️
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900">{item.title}</p>
                                                    <p className="text-gray-400 text-[11px]">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-gray-800">
                                                {order.currency || 'LKR'} {item.price ? Number(item.price).toLocaleString() : '0'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-gray-500 italic">No specific line item records</div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="text-gray-500">
                                    Total: <strong className="text-gray-900">{order.total}</strong>
                                    {order.paymentMethod && <span> ({order.paymentMethod})</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {order.deliveryAddress && (
                                        <span className="text-[11px] text-gray-400 truncate max-w-[200px]" title={order.deliveryAddress}>
                                            📍 {order.deliveryAddress}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersView;
