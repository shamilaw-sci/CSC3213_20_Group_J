import React, { useState, useContext } from 'react';
import { AuthContext } from '../../auth/context/authState';
import ConfirmModal from './ConfirmModal';

const RoleBadge = ({ role }) => (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
        role === 'ADMIN' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
    }`}>
        {role}
    </span>
);

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
        status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
        status === 'DEACTIVATED' ? 'bg-red-100 text-red-600' :
        'bg-yellow-100 text-yellow-700'
    }`}>
        {status || 'ACTIVE'}
    </span>
);

/** Modal that prompts for admin password before promoting a user. */
const PromoteConfirmModal = ({ isOpen, target, onConfirm, onCancel }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!password.trim()) { setError('Password is required'); return; }
        onConfirm(password);
        setPassword('');
        setError('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-gray-900">Confirm Promotion</h3>
                <p className="text-sm text-gray-500">
                    You are about to grant admin access to <span className="font-semibold">{target?.firstName} {target?.lastName}</span> ({target?.email}).
                    Enter your password to confirm.
                </p>
                <input
                    type="password"
                    placeholder="Your admin password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                    autoFocus
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2 justify-end">
                    <button onClick={() => { onCancel(); setPassword(''); setError(''); }}
                        className="px-4 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-semibold rounded-xl bg-gray-900 text-white hover:bg-gray-700">
                        Promote
                    </button>
                </div>
            </div>
        </div>
    );
};

const UserTable = ({ users, onPromote, onDemote, onDelete, onReactivate, loading }) => {
    const { user: currentUser } = useContext(AuthContext);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [promoteTarget, setPromoteTarget] = useState(null);

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
    const isDeactivated = (u) => u.accountStatus === 'DEACTIVATED';

    return (
        <>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {users.map(u => {
                            const isSelf = u.email === currentUser?.email;
                            const deactivated = isDeactivated(u);
                            return (
                                <tr key={u.id} className={`hover:bg-gray-50/70 transition-colors ${
                                    isSelf ? 'bg-blue-50/30' : deactivated ? 'bg-gray-50/60 opacity-60' : ''
                                }`}>
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
                                        <RoleBadge role={u.role || 'CUSTOMER'} />
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <StatusBadge status={u.accountStatus} />
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Reactivate deactivated user */}
                                            {!isSelf && deactivated && (
                                                <button
                                                    onClick={() => onReactivate(u.id)}
                                                    title="Reactivate user"
                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-500 hover:text-white transition-all"
                                                >
                                                    ↺ Reactivate
                                                </button>
                                            )}
                                            {/* Active user actions */}
                                            {!isSelf && !deactivated && u.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => setPromoteTarget(u)}
                                                    title="Promote to Admin"
                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-900 hover:text-white transition-all"
                                                >
                                                    ↑ Promote
                                                </button>
                                            )}
                                            {!isSelf && !deactivated && u.role === 'ADMIN' && (
                                                <button
                                                    onClick={() => onDemote(u.id)}
                                                    title="Demote to Customer"
                                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-500 hover:text-white transition-all"
                                                >
                                                    ↓ Demote
                                                </button>
                                            )}
                                            {!isSelf && !deactivated && (
                                                <button
                                                    onClick={() => setConfirmDelete(u.id)}
                                                    title="Deactivate user"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
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

            {/* Deactivate confirmation modal */}
            <ConfirmModal
                isOpen={!!confirmDelete}
                title="Deactivate User?"
                message={`This will deactivate ${deleteTarget?.firstName} ${deleteTarget?.lastName} (${deleteTarget?.email}). Their order history will be preserved. You can reactivate them later.`}
                confirmLabel="Deactivate"
                onConfirm={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                onCancel={() => setConfirmDelete(null)}
            />

            {/* Promote reauthentication modal */}
            <PromoteConfirmModal
                isOpen={!!promoteTarget}
                target={promoteTarget}
                onConfirm={(password) => { onPromote(promoteTarget.id, password); setPromoteTarget(null); }}
                onCancel={() => setPromoteTarget(null)}
            />
        </>
    );
};

export default UserTable;
