import React, { useState, useEffect, useCallback } from 'react';
import { getAdminOrders, updateAdminOrderStatus, getAdminOrderStats } from '../api/adminOrderApi';
import OrderFulfillmentModal from '../components/OrderFulfillmentModal';
import OrderDetailModal from '../components/OrderDetailModal';

const formatCurrency = (val) =>
    val != null ? `LKR ${parseFloat(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
        return new Date(isoString).toLocaleDateString('en-LK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return isoString;
    }
};

const STATUS_TABS = [
    { label: 'All Orders', value: '' },
    { label: 'Pending Payment', value: 'PENDING_PAYMENT' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
];

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

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters and pagination
    const [activeStatus, setActiveStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Modals
    const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
    const [selectedOrderForFulfillment, setSelectedOrderForFulfillment] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Load orders
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAdminOrders(page, 15, searchTerm, activeStatus);
            setOrders(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load orders.');
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, activeStatus]);

    // Load stats
    const fetchStats = async () => {
        try {
            const statsData = await getAdminOrderStats();
            setStats(statsData);
        } catch {
            // non-fatal
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        fetchStats();
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(0);
        fetchOrders();
    };

    const handleStatusTabClick = (status) => {
        setActiveStatus(status);
        setPage(0);
    };

    const handleUpdateStatus = async (orderId, newStatus, note) => {
        setActionLoading(true);
        try {
            const updated = await updateAdminOrderStatus(orderId, newStatus, note);
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            if (selectedOrderForDetail?.id === updated.id) {
                setSelectedOrderForDetail(updated);
            }
            setSelectedOrderForFulfillment(null);
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update order status');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Track, monitor and update customer order statuses and fulfillment.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            fetchOrders();
                            fetchStats();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Orders</span>
                        <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalOrders ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Awaiting Pay</span>
                        <p className="text-2xl font-black text-amber-600 mt-1">{stats.pendingPaymentOrders ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Processing</span>
                        <p className="text-2xl font-black text-indigo-600 mt-1">{stats.processingOrders ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">In Transit</span>
                        <p className="text-2xl font-black text-purple-600 mt-1">{stats.shippedOrders ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Delivered</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{stats.deliveredOrders ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Revenue</span>
                        <p className="text-lg font-black text-gray-900 mt-1.5 truncate">
                            {formatCurrency(stats.totalRevenue)}
                        </p>
                    </div>
                </div>
            )}

            {/* Filter Tabs & Search */}
            <div className="space-y-3">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleStatusTabClick(tab.value)}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                                activeStatus === tab.value
                                    ? 'bg-gray-950 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by order ref (e.g. ORD-...), recipient name, phone, or email…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2.5 text-sm font-semibold bg-gray-950 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        Search
                    </button>
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                setPage(0);
                            }}
                            className="px-3.5 py-2.5 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </form>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-rose-700 text-sm">
                    {error}
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
                            Loading orders…
                        </div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-20 text-center">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                        </svg>
                        <h3 className="text-base font-bold text-gray-900">No orders found</h3>
                        <p className="text-xs text-gray-400 mt-1">
                            {searchTerm || activeStatus ? 'Try adjusting your search filters.' : 'Purchases from customers will show up here.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider text-left">
                                    <th className="px-5 py-3.5">Order Reference</th>
                                    <th className="px-5 py-3.5">Customer</th>
                                    <th className="px-5 py-3.5">Date</th>
                                    <th className="px-5 py-3.5">Fulfillment Status</th>
                                    <th className="px-5 py-3.5">Payment</th>
                                    <th className="px-5 py-3.5">Items</th>
                                    <th className="px-5 py-3.5 text-right">Total</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <span className="font-bold text-gray-900 block font-mono text-xs">
                                                {order.orderReference || `#${order.id}`}
                                            </span>
                                            <span className="text-[11px] text-gray-400">
                                                {order.deliveryType === 'FAST' ? '⚡ Fast' : '🚚 Standard'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="font-semibold text-gray-900 block">{order.customerName || 'N/A'}</span>
                                            <span className="text-xs text-gray-500">{order.customerPhone || order.customerEmail || '—'}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedOrderForFulfillment(order)}
                                                className="group text-left"
                                                title="Click to update where the order is now"
                                            >
                                                {getStatusBadge(order.status)}
                                                <span className="block text-[10px] text-blue-600 group-hover:underline mt-0.5">
                                                    Change status ✎
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            {getPaymentBadge(order.paymentStatus)}
                                            <span className="block text-[10px] text-gray-400 mt-0.5">
                                                {order.paymentMethod === 'COD' ? 'COD' : order.paymentMethod === 'ONLINE_BANK_TRANSFER' ? 'Bank' : 'Card'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-600">
                                            {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-black text-gray-900 whitespace-nowrap">
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedOrderForDetail(order)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => setSelectedOrderForFulfillment(order)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-gray-950 hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
                                                >
                                                    Update Status
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Showing page <span className="font-semibold">{page + 1}</span> of{' '}
                            <span className="font-semibold">{totalPages}</span> ({totalElements} orders)
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <OrderDetailModal
                isOpen={!!selectedOrderForDetail}
                order={selectedOrderForDetail}
                onClose={() => setSelectedOrderForDetail(null)}
                onOpenFulfillment={(order) => setSelectedOrderForFulfillment(order)}
            />

            <OrderFulfillmentModal
                isOpen={!!selectedOrderForFulfillment}
                order={selectedOrderForFulfillment}
                onClose={() => setSelectedOrderForFulfillment(null)}
                onUpdateStatus={handleUpdateStatus}
                loading={actionLoading}
            />
        </div>
    );
};

export default AdminOrders;
