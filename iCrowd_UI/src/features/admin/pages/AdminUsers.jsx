import React, { useState } from 'react';
import { useAdminUsers } from '../hooks/useAdminUsers';
import UserTable from '../components/UserTable';

const AdminUsers = () => {
    const {
        users, loading, error,
        pagination, goToPage,
        search, handleSearch,
        roleFilter, handleRoleFilter,
        handlePromote, handleDemote, handleDelete, handleReactivate,
    } = useAdminUsers();

    const admins = users.filter(u => u.role === 'ADMIN');
    const regularUsers = users.filter(u => u.role !== 'ADMIN');

    const handleAction = async (action, ...args) => {
        try { await action(...args); } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const [searchInput, setSearchInput] = useState(search);

    const onSearchSubmit = (e) => {
        e.preventDefault();
        handleSearch(searchInput);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
                <p className="text-sm text-gray-400 mt-1">
                    {pagination.totalElements} accounts — {admins.length} admin{admins.length !== 1 ? 's' : ''}, {regularUsers.length} customer{regularUsers.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-600">
                    You cannot modify your own account. Promoting a user requires your password (reauthentication). Deleting an account deactivates it — history is preserved. The last active admin cannot be demoted or deactivated.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={onSearchSubmit} className="flex gap-2 flex-1">
                    <input
                        type="text"
                        placeholder="Search by name or email…"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                    <button type="submit" className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors">
                        Search
                    </button>
                </form>
                <select
                    value={roleFilter}
                    onChange={e => handleRoleFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                    <option value="">All roles</option>
                    <option value="ADMIN">Admins</option>
                    <option value="CUSTOMER">Customers</option>
                </select>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm">{error}</div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-1">
                <UserTable
                    users={users}
                    onPromote={(id, password) => handleAction(handlePromote, id, password)}
                    onDemote={(id) => handleAction(handleDemote, id)}
                    onDelete={(id) => handleAction(handleDelete, id)}
                    onReactivate={(id) => handleAction(handleReactivate, id)}
                    loading={loading}
                />
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page === 0}
                        className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        ← Prev
                    </button>
                    <span className="text-sm text-gray-500">
                        Page {pagination.page + 1} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages - 1}
                        className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
