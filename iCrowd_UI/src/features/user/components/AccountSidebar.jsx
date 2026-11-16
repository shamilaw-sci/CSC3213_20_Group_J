import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

/**
 * AccountSidebar Component
 * Left-side account navigation panel matching the Daraz / modern e-commerce structure.
 */
const AccountSidebar = ({ activeTab, onTabChange, userName = 'User' }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navGroups = [
        {
            title: 'Manage My Account',
            items: [
                { id: 'manage-account', label: 'Manage My Account' },
                { id: 'profile', label: 'My Profile' },
                { id: 'addresses', label: 'Address Book' },
                { id: 'payments', label: 'My Payment Options' },
                { id: 'promotions', label: 'Promotions / Points' }
            ]
        },
        {
            title: 'My Orders',
            items: [
                { id: 'orders', label: 'My Orders' },
                { id: 'returns', label: 'My Returns' },
                { id: 'cancellations', label: 'My Cancellations' }
            ]
        },
        {
            title: 'My Reviews',
            items: [
                { id: 'reviews', label: 'My Reviews' }
            ]
        },
        {
            title: 'Wishlist',
            items: [
                { id: 'wishlist', label: 'My Wishlist' },
                { id: 'followed-stores', label: 'Followed Stores' }
            ]
        },
        {
            title: 'Account Settings',
            items: [
                { id: 'change-password', label: 'Change Password' }
            ]
        }
    ];

    return (
        <aside className="w-full lg:w-64 shrink-0 bg-transparent">
            {/* Top Greeting */}
            <div className="hidden lg:block mb-6 px-1">
                <p className="text-xs text-gray-500 font-medium">Welcome back,</p>
                <h2 className="text-base font-bold text-gray-900 truncate">
                    Hello, <span className="text-black">{userName}</span>
                </h2>
            </div>

            {/* Navigation Groups */}
            <label className="block text-sm font-semibold lg:hidden">Account menu<select value={activeTab} onChange={event => onTabChange(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3">{navGroups.map(group => <optgroup key={group.title} label={group.title}>{group.items.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup>)}</select></label>
            <nav className="hidden lg:block space-y-6">
                {navGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-1.5">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
                            {group.title}
                        </h3>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => onTabChange(item.id)}
                                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-between group ${
                                            isActive
                                                ? 'bg-black text-white font-semibold shadow-sm'
                                                : 'text-gray-600 hover:text-black hover:bg-gray-100'
                                        }`}
                                    >
                                        <span>{item.label}</span>
                                        {isActive && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Logout Button */}
                <div className="pt-2 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default AccountSidebar;
