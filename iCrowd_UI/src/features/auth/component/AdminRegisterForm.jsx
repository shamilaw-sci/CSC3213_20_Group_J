import React from 'react';
import { useAdminRegisterForm } from '../hooks/useAdminRegisterForm';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import AuthAlert from './AuthAlert';

/**
 * Component: AdminRegisterForm
 * Allows authorized administrators to register/create new Admin accounts.
 */
const AdminRegisterForm = ({ onSuccess, onCancel }) => {
    const {
        formData,
        loading,
        error,
        successMessage,
        handleChange,
        handleSubmit,
        resetForm
    } = useAdminRegisterForm(onSuccess);

    return (
        <div className="w-full bg-white border border-gray-200 p-6 md:p-8 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Add New Administrator</h3>
                        <p className="text-xs text-gray-500">Only existing administrators have permission to perform this action.</p>
                    </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    Role: ADMIN
                </span>
            </div>

            <AuthAlert type="error" message={error} />
            <AuthAlert type="success" message={successMessage} />

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AuthInput
                        id="adminFirstName"
                        name="firstName"
                        label="First Name"
                        placeholder="Admin First Name"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="adminLastName"
                        name="lastName"
                        label="Last Name"
                        placeholder="Admin Last Name"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="adminEmail"
                        name="email"
                        type="email"
                        label="Admin Email"
                        placeholder="admin@icrowd.lk"
                        required
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="adminPassword"
                        name="password"
                        type="password"
                        label="Temporary Password"
                        placeholder="Set strong password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="adminPhone"
                        name="phone"
                        type="tel"
                        label="Contact Phone"
                        placeholder="+94 7X XXX XXXX"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="adminDistrict"
                        name="district"
                        label="District"
                        placeholder="District"
                        required
                        value={formData.district}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="adminCity"
                        name="city"
                        label="City"
                        placeholder="City"
                        required
                        value={formData.city}
                        onChange={handleChange}
                    />

                    <AuthInput
                        id="adminAddress"
                        name="address"
                        label="Address / Office"
                        placeholder="Office or residential address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                    />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                onCancel();
                            }}
                            className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <AuthButton
                        type="submit"
                        loading={loading}
                        loadingText="Creating Admin..."
                        className="w-auto px-8"
                    >
                        Create Admin Account
                    </AuthButton>
                </div>
            </form>
        </div>
    );
};

export default AdminRegisterForm;
