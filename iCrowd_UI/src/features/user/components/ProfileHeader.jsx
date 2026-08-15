import React from 'react';

/**
 * Dumb Component: ProfileHeader
 * Renders avatar with user initials, name, email, role badge and tabs/actions.
 */
const ProfileHeader = ({ profile, activeTab, onTabChange }) => {
    const initials = profile?.firstName && profile?.lastName 
        ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
        : 'U';

    const isCustomer = profile?.role !== 'ADMIN';

    return (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary/20 shrink-0">
                    {initials}
                </div>

                {/* User Info */}
                <div className="flex-grow text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            {profile?.firstName} {profile?.lastName}
                        </h1>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isCustomer 
                                ? 'bg-primary/10 text-primary border border-primary/20' 
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                            {isCustomer ? 'Customer' : 'Admin'}
                        </span>
                    </div>

                    <p className="text-gray-500 text-sm font-medium">
                        {profile?.email}
                    </p>

                    {profile?.phone && (
                        <p className="text-gray-400 text-xs mt-1">
                            Contact: <span className="text-gray-600 font-medium">{profile.phone}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 mt-8 pt-6 border-t border-gray-100 overflow-x-auto">
                <button
                    onClick={() => onTabChange('overview')}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                        activeTab === 'overview'
                            ? 'bg-black text-white shadow-sm'
                            : 'text-gray-600 hover:text-black hover:bg-gray-100'
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => onTabChange('edit')}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                        activeTab === 'edit'
                            ? 'bg-black text-white shadow-sm'
                            : 'text-gray-600 hover:text-black hover:bg-gray-100'
                    }`}
                >
                    Edit Profile
                </button>
                <button
                    onClick={() => onTabChange('security')}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                        activeTab === 'security'
                            ? 'bg-black text-white shadow-sm'
                            : 'text-gray-600 hover:text-black hover:bg-gray-100'
                    }`}
                >
                    Security & Password
                </button>
            </div>
        </div>
    );
};

export default ProfileHeader;
