import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/axios';

/**
 * RecentOrdersCard Component
 * Displays live order metrics (Total, Current, Completed) and recent orders.
 */
const RecentOrdersCard = ({ onViewAllOrders }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        apiClient.get('/orders/my-orders')
            .then(res => {
                if (active && Array.isArray(res.data)) {
                    setOrders(res.data);
                }
            })
            .catch(err => {
                console.warn("Could not load recent orders:", err);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, []);

    const totalOrders = orders.length;
    const inProgressOrders = orders.filter(o => o.statusCategory === 'processing').length;
    const completedOrders = orders.filter(o => o.statusCategory === 'delivered').length;
    const recentOrders = orders.slice(0, 3);

    const getStatusStyle = (statusCategory) => {
        if (statusCategory === 'delivered') {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        if (statusCategory === 'cancellations') {
            return 'bg-red-50 text-red-700 border-red-200';
        }
        return 'bg-amber-50 text-amber-700 border-amber-200';
    };

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
                    VIEW ALL ({totalOrders})
                </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 text-center">
                    <span className="text-lg font-black text-gray-900 block">{totalOrders}</span>
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total Orders</span>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 text-center">
                    <span className="text-lg font-black text-blue-700 block">{inProgressOrders}</span>
                    <span className="text-[11px] font-medium text-blue-600 uppercase tracking-wide">In Progress</span>
                </div>
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 text-center">
                    <span className="text-lg font-black text-emerald-700 block">{completedOrders}</span>
                    <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wide">Completed</span>
                </div>
            </div>

            {/* Orders Table / List */}
            {loading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading order activity...</div>
            ) : recentOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 space-y-2">
                    <p>You have not placed any orders yet.</p>
                    <Link
                        to="/products"
                        className="inline-block text-xs font-semibold text-black underline hover:text-gray-700 cursor-pointer"
                    >
                        Browse Products
                    </Link>
                </div>
            ) : (
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
                            {recentOrders.map((order) => {
                                const itemCount = order.items ? order.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0;
                                const firstItemTitle = order.items && order.items.length > 0 ? order.items[0].title : 'Order items';

                                return (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-2 font-mono font-bold text-gray-900">{order.orderReference}</td>
                                        <td className="py-3 px-2 text-gray-500">{order.date || 'Recent'}</td>
                                        <td className="py-3 px-2 text-gray-800 font-medium max-w-[200px] truncate">
                                            {firstItemTitle}
                                            {itemCount > 1 && (
                                                <span className="text-gray-400 ml-1">+{itemCount - 1} more</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-2 font-semibold text-gray-900">{order.total}</td>
                                        <td className="py-3 px-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusStyle(order.statusCategory)}`}>
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
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RecentOrdersCard;
