import React from 'react';

/**
 * PersonalProfileCard Component
 * Displays user's personal details, email verification status, and quick actions.
 */
const PersonalProfileCard = ({ profile, onEditClick, onChangePasswordClick }) => {
    const initials = profile?.firstName && profile?.lastName
        ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
        : profile?.firstName
            ? profile.firstName.charAt(0).toUpperCase()
            : 'U';

    const username = profile?.username || profile?.email?.split('@')[0] || 'user';

    return (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">Personal Profile</span>
                        <span className="text-gray-300">|</span>
                        <button
                            type="button"
                            onClick={onChangePasswordClick}
                            className="text-xs font-semibold text-gray-600 hover:text-black transition-colors"
                        >
                            Change Password
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={onEditClick}
                        className="text-xs font-bold text-black hover:underline uppercase tracking-wide cursor-pointer"
                    >
                        EDIT
                    </button>
                </div>

                {/* Profile Details */}
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold shadow shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="text-base font-bold text-gray-900 truncate">
                            {profile?.firstName} {profile?.lastName}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                            @{username}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Email Verified
                            </span>
                        </div>
                    </div>
                </div>

                {/* Information Grid */}
                <div className="space-y-3 pt-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400 font-medium">Email Address</span>
                        <span className="text-gray-800 font-semibold truncate">{profile?.email || 'N/A'}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-400 font-medium">Mobile Number</span>
                        <span className="text-gray-800 font-semibold">{profile?.phone || 'Not provided'}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between py-1">
                        <span className="text-gray-400 font-medium">Default City</span>
                        <span className="text-gray-800 font-semibold">{profile?.city || 'Colombo'}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400">Receive marketing newsletters?</span>
                <span className="text-emerald-600 font-semibold">Subscribed</span>
            </div>
        </div>
    );
};

export default PersonalProfileCard;
