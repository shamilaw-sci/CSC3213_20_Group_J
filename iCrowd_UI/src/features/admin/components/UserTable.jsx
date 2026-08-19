import React, { useState, useContext } from 'react';
import { AuthContext } from '../../auth/context/AuthContext';
import ConfirmModal from './ConfirmModal';

const RoleBadge = ({ role }) => (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
        role === 'ADMIN' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
    }`}>
        {role}
    </span>
);

const UserTable = ({ users, onPromote, onDemote, onDelete, loading }) => {
    const { user: currentUser } = useContext(AuthContext);
    const [confirmDelete, setConfirmDelete] = useState(null);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Loading users…
                </div>
            </div>
        );
    }

    const deleteTarget = users.find(u => u.id === confirmDelete);

    return (
        <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {users.map(u => {
                            const isSelf = u.email === currentUser?.email;
                            return (
                                <tr key={u.id} className={`hover:bg-gray-50/70 transition-colors ${isSelf ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                                                <span className="text-white text-xs font-bold">
                                                    {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {u.firstName} {u.lastName}
                                                    {isSelf && <span className="ml-2 text-xs text-blue-500 font-medium">(you)</span>}
                                                </p>
                                                <p className="text-xs text-gray-400">{u.phone || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-gray-600">{u.email}</td>
                                    <td className="px-4 py-3.5 text-center">
                                        <RoleBadge role={u.role || 'USER'} />
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center justify-center gap-2">
                                            {!isSelf && u.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => onPromote(u.id)}
                                                    title="Promote to Admin"
                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-900 hover:text-white transition-all"
                                                >
                                                    ↑ Promote
                                                </button>
                                            )}
                                            {!isSelf && u.role === 'ADMIN' && (
                                                <button
                                                    onClick={() => onDemote(u.id)}
                                                    title="Demote to User"
                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-500 hover:text-white transition-all"
                                                >
                                                    ↓ Demote
                                                </button>
                                            )}
                                            {!isSelf && (
                                                <button
                                                    onClick={() => setConfirmDelete(u.id)}
                                                    title="Delete user"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={!!confirmDelete}
                title="Delete User?"
                message={`This will permanently delete ${deleteTarget?.firstName} ${deleteTarget?.lastName} (${deleteTarget?.email}). This action cannot be undone.`}
                confirmLabel="Delete User"
                onConfirm={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                onCancel={() => setConfirmDelete(null)}
            />
        </>
    );
};

export default UserTable;
