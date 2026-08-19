import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardData } from '../api/adminUserApi';
import DashboardCard from '../components/DashboardCard';

const formatCurrency = (val) =>
    val != null ? `LKR ${parseFloat(val).toLocaleString('en-LK', { minimumFractionDigits: 2 })}` : '—';

const MiniTable = ({ title, rows, columns }) => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
        {rows.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No data yet</div>
        ) : (
            <div className="overflow-x-auto">
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
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
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
            label: 'Total Products',
            value: data?.totalProducts ?? 0,
            color: 'slate',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
            ),
        },
        {
            label: 'Active Products',
            value: data?.activeProducts ?? 0,
            color: 'green',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            label: 'Categories',
            value: data?.totalCategories ?? 0,
            color: 'blue',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
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
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-sm text-gray-400 mt-1">Welcome back! Here's what's happening.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/admin/products"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-950 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-all active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.map(s => (
                    <DashboardCard key={s.label} {...s} />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
                {[
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MiniTable
                    title="Recent Products"
                    rows={data?.recentProducts || []}
                    columns={recentCols}
                />
                <MiniTable
                    title="⚠ Low Stock Alert"
                    rows={data?.lowStockProducts || []}
                    columns={lowStockCols}
                />
            </div>
        </div>
    );
};

export default AdminDashboard;
