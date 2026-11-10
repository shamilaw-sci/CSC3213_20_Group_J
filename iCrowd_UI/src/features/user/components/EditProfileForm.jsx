import React from 'react';
import AuthInput from '../../auth/component/AuthInput';
import AuthButton from '../../auth/component/AuthButton';
import AuthAlert from '../../auth/component/AuthAlert';

/**
 * Dumb Component: EditProfileForm
 * Form for updating user profile attributes (excluding email/role which are locked).
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
                        value={formData.firstName}
                        onChange={onChange}
                    />

                    <AuthInput
                        id="lastName"
                        name="lastName"
                        label="Last Name"
                        required
                        value={formData.lastName}
                        onChange={onChange}
                    />

                    <AuthInput
                        id="phone"
                        name="phone"
                        type="tel"
                        label="Phone Number"
                        required
                        value={formData.phone}
                        onChange={onChange}
                    />

                    <AuthInput
                        id="district"
                        name="district"
                        label="District"
                        value={formData.district}
                        onChange={onChange}
                    />

                    <AuthInput
                        id="city"
                        name="city"
                        label="City"
                        value={formData.city}
                        onChange={onChange}
                    />

                    <AuthInput
                        id="address"
                        name="address"
                        label="Street Address"
                        value={formData.address}
                        onChange={onChange}
                    />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                        Cancel
                    </button>

                    <AuthButton
                        type="submit"
                        loading={loading}
                        loadingText="Saving Changes..."
                        className="w-auto px-8"
                    >
                        Save Changes
                    </AuthButton>
                </div>
            </form>
        </div>
    );
};

export default EditProfileForm;
