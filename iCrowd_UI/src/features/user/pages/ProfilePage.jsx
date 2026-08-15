import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import ProfileHeader from '../components/ProfileHeader';
import ProfileInfoCard from '../components/ProfileInfoCard';
import EditProfileForm from '../components/EditProfileForm';
import ChangePasswordForm from '../components/ChangePasswordForm';

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const {
        profile,
        formData,
        loading,
        updating,
        error,
        successMessage,
        handleChange,
        handleSave,
        cancelEdit
    } = useUserProfile();

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-500 font-medium">Loading user profile...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <ProfileHeader
                profile={profile}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {activeTab === 'overview' && (
                <ProfileInfoCard
                    profile={profile}
                    onEditClick={() => setActiveTab('edit')}
                />
            )}

            {activeTab === 'edit' && (
                <EditProfileForm
                    formData={formData}
                    loading={updating}
                    error={error}
                    successMessage={successMessage}
                    email={profile?.email}
                    onChange={handleChange}
                    onSubmit={handleSave}
                    onCancel={() => {
                        cancelEdit();
                        setActiveTab('overview');
                    }}
                />
            )}

            {activeTab === 'security' && (
                <ChangePasswordForm />
            )}
        </div>
    );
};

export default ProfilePage;
