import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardData } from '../api/adminUserApi';
import DashboardCard from '../components/DashboardCard';

const formatCurrency = (val) =>
    val != null ? `LKR ${parseFloat(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

const MiniTable = ({ title, rows, columns, linkTo, linkText }) => (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            {linkTo && (
                <Link to={linkTo} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    {linkText || 'View All →'}
                </Link>
            )}
        </div>
        {rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">No data yet</div>
        ) : (
            <div className="overflow-x-auto flex-1">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-50">
                            {columns.map(col => (
                                <th key={col.key} className="px-5 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((row, i) => (
                            <tr key={row.id || i} className="hover:bg-gray-50/50 transition-colors">
                                {columns.map(col => (
                                    <td key={col.key} className="px-5 py-3 text-gray-700">
                                        {col.render ? col.render(row) : row[col.key] ?? '—'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

const getStatusBadge = (status) => {
    const badges = {
        PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
        CONFIRMED: 'bg-blue-100 text-blue-800',
        PROCESSING: 'bg-indigo-100 text-indigo-800',
        SHIPPED: 'bg-purple-100 text-purple-800',
        DELIVERED: 'bg-emerald-100 text-emerald-800',
        COMPLETED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-rose-100 text-rose-800',
    };
    return (
        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
            {status || 'UNKNOWN'}
        </span>
    );
};

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getDashboardData()
            .then(setData)
            .catch(err => setError(err.response?.data?.message || 'Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
                    Loading dashboard…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-600 text-sm">
                {error}
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Orders',
            value: data?.totalOrders ?? 0,
            color: 'slate',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
        },
        {
            label: 'Total Revenue',
            value: formatCurrency(data?.totalRevenue ?? 0),
            color: 'green',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            label: 'In Delivery',
            value: data?.shippedOrders ?? 0,
            color: 'purple',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
            ),
        },
        {
            label: 'Total Products',
            value: data?.totalProducts ?? 0,
            color: 'blue',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
            ),
        },
        {
            label: 'Out of Stock',
            value: data?.outOfStock ?? 0,
            color: 'red',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
        },
        {
            label: 'Total Users',
            value: data?.totalUsers ?? 0,
            color: 'amber',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
    ];

    const recentOrderCols = [
        {
            key: 'orderReference',
            label: 'Order',
            render: (o) => (
                <div>
                    <span className="font-bold text-gray-900 block font-mono text-xs">{o.orderReference || `#${o.id}`}</span>
                    <span className="text-[11px] text-gray-400">{o.customerName || 'Customer'}</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (o) => getStatusBadge(o.status),
        },
        {
            key: 'totalAmount',
            label: 'Total',
            render: (o) => <span className="font-bold text-gray-900">{formatCurrency(o.totalAmount)}</span>,
        },
    ];

    const recentCols = [
        { key: 'name', label: 'Product', render: (p) => <span className="font-medium text-gray-900">{p.name}</span> },
        { key: 'category', label: 'Category', render: (p) => p.category?.name || '—' },
        { key: 'price', label: 'Price', render: (p) => formatCurrency(p.price) },
        { key: 'availableStock', label: 'Stock' },
    ];

    const lowStockCols = [
        { key: 'name', label: 'Product', render: (p) => <span className="font-medium text-gray-900">{p.name}</span> },
        { key: 'availableStock', label: 'Stock', render: (p) => (
            <span className={`font-bold ${p.availableStock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                {p.availableStock === 0 ? 'OUT OF STOCK' : p.availableStock}
            </span>
        )},
        { key: 'category', label: 'Category', render: (p) => p.category?.name || '—' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-1">Real-time overview of store performance, orders and catalog.</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        to="/admin/orders"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-800 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        View Orders
                    </Link>
                    <Link
                        to="/admin/products"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-950 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {stats.map(s => (
                    <DashboardCard key={s.label} {...s} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Manage Orders', to: '/admin/orders', desc: 'Track & update order status' },
                    { label: 'Manage Products', to: '/admin/products', desc: 'Add, edit, deactivate' },
                    { label: 'Manage Categories', to: '/admin/categories', desc: 'Organise product groups' },
                    { label: 'Manage Users', to: '/admin/users', desc: 'Promote or remove users' },
                ].map(action => (
                    <Link
                        key={action.to}
                        to={action.to}
                        className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all hover:border-gray-200 group"
                    >
                        <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{action.label}</p>
                        <p className="text-xs text-gray-400 mt-1">{action.desc}</p>
                        <span className="inline-block mt-3 text-xs font-semibold text-gray-400 group-hover:text-gray-900 transition-colors">Go →</span>
                    </Link>
                ))}
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MiniTable
                    title="Recent Orders"
                    rows={data?.recentOrders || []}
                    columns={recentOrderCols}
                    linkTo="/admin/orders"
                    linkText="Manage All →"
                />
                <MiniTable
                    title="Recent Products"
                    rows={data?.recentProducts || []}
                    columns={recentCols}
                    linkTo="/admin/products"
                />
                <MiniTable
                    title="⚠ Low Stock Alert"
                    rows={data?.lowStockProducts || []}
                    columns={lowStockCols}
                    linkTo="/admin/products"
                />
            </div>
        </div>
    );
};

export default AdminDashboard;
