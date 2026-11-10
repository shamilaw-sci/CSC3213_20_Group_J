import React, { useState } from 'react';

/**
 * OrdersView Component
 * Displays order history, tracking, returns, and cancellations.
 */
const OrdersView = ({ filterType = 'all' }) => {
    const [selectedTab, setSelectedTab] = useState(
        filterType === 'returns' ? 'returns' : filterType === 'cancellations' ? 'cancellations' : 'all'
    );

    const allOrders = [
        {
            id: 'ORD-89241',
            date: '20 August 2026',
            items: [
                { title: 'Wireless Noise-Cancelling Headphones', qty: 1, price: 'LKR 18,500' }
            ],
            total: 'LKR 18,500',
            status: 'Processing',
            statusCategory: 'processing',
            deliveryAddress: '123 Main Street, Colombo 03',
            paymentMethod: 'Credit Card (**** 4242)'
        },
        {
            id: 'ORD-76219',
            date: '12 August 2026',
            items: [
                { title: 'Ergonomic Mechanical Keyboard (RGB, Brown Switch)', qty: 1, price: 'LKR 15,900' },
                { title: 'Memory Foam Wrist Rest Pad', qty: 1, price: 'LKR 9,000' }
            ],
            total: 'LKR 24,900',
            status: 'Delivered',
            statusCategory: 'delivered',
            deliveryAddress: '123 Main Street, Colombo 03',
            paymentMethod: 'Cash on Delivery'
        },
        {
            id: 'ORD-65104',
            date: '28 July 2026',
            items: [
                { title: 'Ultra-thin Laptop Stand & 7-in-1 Hub', qty: 1, price: 'LKR 8,400' }
            ],
            total: 'LKR 8,400',
            status: 'Delivered',
            statusCategory: 'delivered',
            deliveryAddress: '45 Office Road, Colombo 02',
            paymentMethod: 'Credit Card (**** 1122)'
        },
        {
            id: 'ORD-54011',
            date: '10 July 2026',
            items: [
                { title: 'Bluetooth Trackpad', qty: 1, price: 'LKR 11,200' }
            ],
            total: 'LKR 11,200',
            status: 'Cancelled',
            statusCategory: 'cancellations',
            deliveryAddress: '123 Main Street, Colombo 03',
            paymentMethod: 'Refunded to Card'
        }
    ];

    const filteredOrders = allOrders.filter(order => {
        if (selectedTab === 'all') return true;
        if (selectedTab === 'processing') return order.statusCategory === 'processing';
        if (selectedTab === 'delivered') return order.statusCategory === 'delivered';
        if (selectedTab === 'returns') return order.statusCategory === 'returns';
        if (selectedTab === 'cancellations') return order.statusCategory === 'cancellations';
        return true;
    });

    return (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-base font-bold text-gray-900">
                        {filterType === 'returns' ? 'My Returns' : filterType === 'cancellations' ? 'My Cancellations' : 'My Orders'}
                    </h3>
                    <p className="text-xs text-gray-500">Track and view previous purchases and delivery status</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto text-xs font-semibold">
                {[
                    { id: 'all', label: 'All Orders' },
                    { id: 'processing', label: 'To Receive / In Transit' },
                    { id: 'delivered', label: 'Delivered' },
                    { id: 'returns', label: 'Returns' },
                    { id: 'cancellations', label: 'Cancellations' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedTab(tab.id)}
                        className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                            selectedTab === tab.id
                                ? 'bg-black text-white shadow-sm'
                                : 'text-gray-500 hover:text-black hover:bg-gray-100'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">
                    No orders found in this section.
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="border border-gray-200/80 rounded-xl p-4 hover:border-gray-300 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                                <div>
                                    <span className="font-bold text-gray-900">Order #{order.id}</span>
                                    <span className="text-gray-400 mx-2">•</span>
                                    <span className="text-gray-500">Placed on {order.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                        order.status === 'Delivered'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : order.status === 'Cancelled'
                                                ? 'bg-red-50 text-red-700 border border-red-200'
                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            <div className="py-3 space-y-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400">
                                                📦
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{item.title}</p>
                                                <p className="text-gray-400 text-[11px]">Qty: {item.qty}</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-gray-800">{item.price}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="text-gray-500">
                                    Total: <strong className="text-gray-900">{order.total}</strong> ({order.paymentMethod})
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                                    >
                                        Order Details
                                    </button>
                                    {order.status === 'Delivered' && (
                                        <button
                                            type="button"
                                            className="px-3 py-1.5 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 cursor-pointer"
                                        >
                                            Buy Again
                                        </button>
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
