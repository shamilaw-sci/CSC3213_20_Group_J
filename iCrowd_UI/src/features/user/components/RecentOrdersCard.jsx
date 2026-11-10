import React from 'react';

/**
 * RecentOrdersCard Component
 * Displays order summary counters (Total, Current, Completed) and recent orders list.
 */
const RecentOrdersCard = ({ onViewAllOrders }) => {
    const ordersSummary = {
        total: 4,
        current: 1,
        completed: 3
    };

    const recentOrders = [
        {
            id: 'ORD-89241',
            date: '2026-08-20',
            item: 'Wireless Noise-Cancelling Headphones',
            itemsCount: 1,
            amount: 'LKR 18,500',
            status: 'Processing',
            statusColor: 'bg-amber-50 text-amber-700 border-amber-200'
        },
        {
            id: 'ORD-76219',
            date: '2026-08-12',
            item: 'Ergonomic Mechanical Keyboard',
            itemsCount: 2,
            amount: 'LKR 24,900',
            status: 'Delivered',
            statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        },
        {
            id: 'ORD-65104',
            date: '2026-07-28',
            item: 'Ultra-thin Laptop Stand & Hub',
            itemsCount: 1,
            amount: 'LKR 8,400',
            status: 'Delivered',
            statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }
    ];

    return (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
                    <p className="text-xs text-gray-500">Track and manage your order shipments</p>
                </div>
                <button
                    type="button"
                    onClick={onViewAllOrders}
                    className="text-xs font-bold text-black hover:underline uppercase tracking-wide cursor-pointer"
                >
                    VIEW ALL ({ordersSummary.total})
                </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 text-center">
                    <span className="text-lg font-black text-gray-900 block">{ordersSummary.total}</span>
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Orders</span>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 text-center">
                    <span className="text-lg font-black text-blue-700 block">{ordersSummary.current}</span>
                    <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wide">In Progress</span>
                </div>
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 text-center">
                    <span className="text-lg font-black text-emerald-700 block">{ordersSummary.completed}</span>
                    <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wide">Completed</span>
                </div>
            </div>

            {/* Orders Table / List */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                            <th className="py-2.5 px-2">Order #</th>
                            <th className="py-2.5 px-2">Placed On</th>
                            <th className="py-2.5 px-2">Items</th>
                            <th className="py-2.5 px-2">Total</th>
                            <th className="py-2.5 px-2">Status</th>
                            <th className="py-2.5 px-2 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {recentOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-2 font-mono font-bold text-gray-900">{order.id}</td>
                                <td className="py-3 px-2 text-gray-500">{order.date}</td>
                                <td className="py-3 px-2 text-gray-800 font-medium max-w-[200px] truncate">
                                    {order.item}
                                    {order.itemsCount > 1 && (
                                        <span className="text-gray-400 ml-1">+{order.itemsCount - 1} more</span>
                                    )}
                                </td>
                                <td className="py-3 px-2 font-semibold text-gray-900">{order.amount}</td>
                                <td className="py-3 px-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${order.statusColor}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-3 px-2 text-right">
                                    <button
                                        type="button"
                                        onClick={onViewAllOrders}
                                        className="text-xs font-semibold text-black hover:underline cursor-pointer"
                                    >
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentOrdersCard;
