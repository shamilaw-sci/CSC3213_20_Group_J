import React from 'react';

/**
 * Dumb Component: ProfileInfoCard
 * Displays user's personal info and shipping/delivery address in clean card layout.
 */
const ProfileInfoCard = ({ profile, onEditClick }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Personal Information
                        </h3>
                        <button
                            onClick={onEditClick}
                            className="text-xs font-bold text-primary hover:text-black transition-colors"
                        >
                            Edit
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</span>
                            <span className="text-gray-900 font-semibold text-base">{profile?.firstName} {profile?.lastName}</span>
                        </div>

                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</span>
                            <span className="text-gray-900 font-medium text-base">{profile?.email}</span>
                        </div>

                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone Number</span>
                            <span className="text-gray-900 font-medium text-base">{profile?.phone || 'Not provided'}</span>
                        </div>

                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Role</span>
                            <span className="text-gray-900 font-medium text-base capitalize">{profile?.role?.toLowerCase() || 'Customer'}</span>
                        </div>
                    </div>
                </div>

                {/* Delivery / Location Information */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Delivery & Address
                        </h3>
                        <button
                            onClick={onEditClick}
                            className="text-xs font-bold text-primary hover:text-black transition-colors"
                        >
                            Edit
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Street Address</span>
                            <span className="text-gray-900 font-medium text-base">{profile?.address || 'Not provided'}</span>
                        </div>

                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">City</span>
                            <span className="text-gray-900 font-medium text-base">{profile?.city || 'Not provided'}</span>
                        </div>

                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">District</span>
                            <span className="text-gray-900 font-medium text-base">{profile?.district || 'Not provided'}</span>
                        </div>

                        <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Country</span>
                            <span className="text-gray-900 font-medium text-base">Sri Lanka</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileInfoCard;
