import React, { useState } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAddressBook } from '../hooks/useAddressBook';
import AccountSidebar from '../components/AccountSidebar';
import PersonalProfileCard from '../components/PersonalProfileCard';
import AddressBookCard from '../components/AddressBookCard';
import AddressModal from '../components/AddressModal';
import RecentOrdersCard from '../components/RecentOrdersCard';
import PromotionsCard from '../components/PromotionsCard';
import AddressBookView from '../components/AddressBookView';
import OrdersView from '../components/OrdersView';
import ReviewsView from '../components/ReviewsView';
import WishlistView from '../components/WishlistView';
import PaymentOptionsView from '../components/PaymentOptionsView';
import EditProfileForm from '../components/EditProfileForm';
import ChangePasswordForm from '../components/ChangePasswordForm';

/**
 * ProfilePage Component
 * E-commerce Manage My Account page (Daraz-inspired structure and UX)
 */
const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('manage-account');
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

    const {
        addresses,
        defaultAddress,
        error: addressError,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress
    } = useAddressBook(profile);

    // Address Modal State
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const handleOpenAddAddress = () => {
        setEditingAddress(null);
        setIsAddressModalOpen(true);
    };

    const handleOpenEditAddress = (addr) => {
        setEditingAddress(addr);
        setIsAddressModalOpen(true);
    };

    const handleSaveAddress = async (addressData) => {
        if (editingAddress) {
            await updateAddress(editingAddress.id, addressData);
        } else {
            await addAddress(addressData);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] bg-gray-50/50 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-3 border-gray-300 border-t-black rounded-full animate-spin mb-3"></div>
                <span className="text-gray-500 font-medium text-sm">Loading your account...</span>
            </div>
        );
    }

    const fullName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Valued Customer';

    return (
        <div className="min-h-screen bg-[#f8f9fa] py-6 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="text-xs text-gray-500 mb-6 flex items-center gap-1.5">
                    <span className="hover:text-black cursor-pointer">Home</span>
                    <span>/</span>
                    <span className="hover:text-black cursor-pointer">My Account</span>
                    <span>/</span>
                    <span className="text-black font-semibold capitalize">
                        {activeTab.replace('-', ' ')}
                    </span>
                </div>

                {/* Main 2-Column Layout */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Left Sidebar */}
                    <AccountSidebar
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        userName={fullName}
                    />

                    {/* Main Content Area */}
                    <main className="flex-1 w-full min-w-0 space-y-6">
                        {/* 1. Manage My Account (Main Overview Dashboard) */}
                        {activeTab === 'manage-account' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-bold text-gray-900">Manage My Account</h1>
                                </div>

                                {/* Top Row: Personal Profile & Address Book */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <PersonalProfileCard
                                        profile={profile}
                                        onEditClick={() => setActiveTab('profile')}
                                        onChangePasswordClick={() => setActiveTab('change-password')}
                                    />

                                    <AddressBookCard
                                        addresses={addresses}
                                        defaultAddress={defaultAddress}
                                        onAddClick={handleOpenAddAddress}
                                        onEditAddress={handleOpenEditAddress}
                                        onDeleteAddress={deleteAddress}
                                        onManageAllClick={() => setActiveTab('addresses')}
                                    />
                                </div>

                                {/* Row 2: Recent Orders Summary */}
                                <RecentOrdersCard
                                    onViewAllOrders={() => setActiveTab('orders')}
                                />

                                {/* Row 3: Promotions & Vouchers */}
                                <PromotionsCard />
                            </div>
                        )}

                        {/* 2. My Profile / Edit Details */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('manage-account')}
                                        className="text-xs font-semibold text-gray-600 hover:text-black"
                                    >
                                        &larr; Back to Dashboard
                                    </button>
                                </div>

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
                                        setActiveTab('manage-account');
                                    }}
                                />
                            </div>
                        )}

                        {/* 3. Address Book View */}
                        {activeTab === 'addresses' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-bold text-gray-900">Address Book</h1>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('manage-account')}
                                        className="text-xs font-semibold text-gray-600 hover:text-black"
                                    >
                                        &larr; Back to Dashboard
                                    </button>
                                </div>

                                <AddressBookView
                                    addresses={addresses}
                                    error={addressError}
                                    onAddClick={handleOpenAddAddress}
                                    onEditAddress={handleOpenEditAddress}
                                    onDeleteAddress={deleteAddress}
                                    onSetDefault={setDefaultAddress}
                                />
                            </div>
                        )}

                        {/* 4. My Orders / Returns / Cancellations */}
                        {(activeTab === 'orders' || activeTab === 'returns' || activeTab === 'cancellations') && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-bold text-gray-900">
                                        {activeTab === 'returns' ? 'My Returns' : activeTab === 'cancellations' ? 'My Cancellations' : 'My Orders'}
                                    </h1>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('manage-account')}
                                        className="text-xs font-semibold text-gray-600 hover:text-black"
                                    >
                                        &larr; Back to Dashboard
                                    </button>
                                </div>

                                <OrdersView filterType={activeTab} />
                            </div>
                        )}

                        {/* 5. My Reviews */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-bold text-gray-900">My Reviews</h1>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('manage-account')}
                                        className="text-xs font-semibold text-gray-600 hover:text-black"
                                    >
                                        &larr; Back to Dashboard
                                    </button>
                                </div>

                                <ReviewsView />
                            </div>
                        )}

                        {/* 6. Wishlist & Followed Stores */}
                        {(activeTab === 'wishlist' || activeTab === 'followed-stores') && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-bold text-gray-900">
                                        {activeTab === 'followed-stores' ? 'Followed Stores' : 'My Wishlist'}
                                    </h1>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('manage-account')}
                                        className="text-xs font-semibold text-gray-600 hover:text-black"
                                    >
                                        &larr; Back to Dashboard
                                    </button>
                                </div>

                                <WishlistView isFollowedStores={activeTab === 'followed-stores'} />
                            </div>
                        )}

                        {/* 7. Payment Options */}
                        {activeTab === 'payments' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-bold text-gray-900">Payment Options</h1>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('manage-account')}
                                        className="text-xs font-semibold text-gray-600 hover:text-black"
                                    >
                                        &larr; Back to Dashboard
                                    </button>
                                </div>

                                <PaymentOptionsView />
                            </div>
                        )}

                        {/* 8. Promotions View */}
                        {activeTab === 'promotions' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-bold text-gray-900">Promotions & Vouchers</h1>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('manage-account')}
                                        className="text-xs font-semibold text-gray-600 hover:text-black"
                                    >
                                        &larr; Back to Dashboard
                                    </button>
                                </div>

                                <PromotionsCard />
                            </div>
                        )}

                        {/* 9. Change Password */}
                        {activeTab === 'change-password' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-bold text-gray-900">Change Password</h1>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('manage-account')}
                                        className="text-xs font-semibold text-gray-600 hover:text-black"
                                    >
                                        &larr; Back to Dashboard
                                    </button>
                                </div>

                                <ChangePasswordForm />
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Address Modal with Map Picker */}
            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={() => setIsAddressModalOpen(false)}
                onSave={handleSaveAddress}
                addressToEdit={editingAddress}
            />
        </div>
    );
};

export default ProfilePage;