import React from 'react';
import AuthInput from '../../auth/component/AuthInput';
import AuthButton from '../../auth/component/AuthButton';
import AuthAlert from '../../auth/component/AuthAlert';

/**
 * EditProfileForm Component
 * Form for updating user profile attributes with input validation.
 */
const EditProfileForm = ({
    formData,
    loading,
    error,
    successMessage,
    email,
    onChange,
    onSubmit,
    onCancel
}) => {
    return (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Edit Personal Details</h3>
                <p className="text-xs text-gray-500 mt-1">Update your account information and default delivery details.</p>
            </div>

            <AuthAlert type="error" message={error} />
            <AuthAlert type="success" message={successMessage} />

            <form onSubmit={onSubmit} className="space-y-6">
                {/* Locked Email field */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email Address (Read-only)
                    </label>
                    <input
                        type="email"
                        disabled
                        value={email || ''}
                        className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed text-sm shadow-sm"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Email address is tied to your primary account authentication.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <AuthInput
                        id="firstName"
                        name="firstName"
                        label="First Name"
                        required
                        maxLength={50}
                        value={formData.firstName}
                        onChange={onChange}
                    />

                    <AuthInput
                        id="lastName"
                        name="lastName"
                        label="Last Name"
                        required
                        maxLength={50}
                        value={formData.lastName}
                        onChange={onChange}
                    />

                    <AuthInput
                        id="phone"
                        name="phone"
                        type="tel"
                        label="Phone Number"
                        required
                        placeholder="+94 77 123 4567"
                        value={formData.phone}
                        onChange={onChange}
                    />

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                            Date of Birth <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                        </label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            value={formData.dateOfBirth || ''}
                            onChange={onChange}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <AuthInput
                        id="district"
                        name="district"
                        label="District"
                        maxLength={100}
                        value={formData.district}
                        onChange={onChange}
                    />

                    <AuthInput
                        id="city"
                        name="city"
                        label="City"
                        maxLength={100}
                        value={formData.city}
                        onChange={onChange}
                    />

                    <div className="md:col-span-2">
                        <AuthInput
                            id="address"
                            name="address"
                            label="Street Address"
                            maxLength={255}
                            value={formData.address}
                            onChange={onChange}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <AuthInput
                            id="profileImage"
                            name="profileImage"
                            label="Profile Avatar URL (Optional)"
                            maxLength={2048}
                            placeholder="https://example.com/photo.jpg"
                            value={formData.profileImage || ''}
                            onChange={onChange}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                    >
                        Cancel
                    </button>

                    <AuthButton
                        type="submit"
                        loading={loading}
                        loadingText="Saving Changes..."
                        className="w-auto px-8 cursor-pointer"
                    >
                        Save Changes
                    </AuthButton>
                </div>
            </form>
        </div>
    );
};

export default EditProfileForm;