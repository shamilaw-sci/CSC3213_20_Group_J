import React from 'react';
import { useAdminUsers } from '../hooks/useAdminUsers';
import UserTable from '../components/UserTable';

const AdminUsers = () => {
    const { users, loading, error, handlePromote, handleDemote, handleDelete } = useAdminUsers();

    const admins = users.filter(u => u.role === 'ADMIN');
    const regularUsers = users.filter(u => u.role !== 'ADMIN');

    const handleAction = async (action, id) => {
        try { await action(id); } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
                <p className="text-sm text-gray-400 mt-1">
                    {users.length} accounts — {admins.length} admin{admins.length !== 1 ? 's' : ''}, {regularUsers.length} customer{regularUsers.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-600">
                    You cannot modify your own account. Promoting a user grants full admin access. Demotion removes admin privileges immediately.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm">{error}</div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-1">
                <UserTable
                    users={users}
                    onPromote={(id) => handleAction(handlePromote, id)}
                    onDemote={(id) => handleAction(handleDemote, id)}
                    onDelete={(id) => handleAction(handleDelete, id)}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default AdminUsers;
