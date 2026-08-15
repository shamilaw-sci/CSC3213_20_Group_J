import React from 'react';
import { useChangePassword } from '../hooks/useChangePassword';
import AuthInput from '../../auth/component/AuthInput';
import AuthButton from '../../auth/component/AuthButton';
import AuthAlert from '../../auth/component/AuthAlert';

/**
 * Component: ChangePasswordForm
 * Provides secure password update interface.
 */
const ChangePasswordForm = () => {
    const {
        passwordData,
        loading,
        error,
        successMessage,
        handleChange,
        handleSubmit,
        resetForm
    } = useChangePassword();

    return (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Update Account Password
                </h3>
                <p className="text-xs text-gray-500 mt-1">Ensure your account uses a strong and unique password.</p>
            </div>

            <AuthAlert type="error" message={error} />
            <AuthAlert type="success" message={successMessage} />

            <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
                <AuthInput
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    label="Current Password"
                    placeholder="Enter your current password"
                    required
                    value={passwordData.currentPassword}
                    onChange={handleChange}
                />

                <AuthInput
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    label="New Password"
                    placeholder="Minimum 6 characters"
                    required
                    value={passwordData.newPassword}
                    onChange={handleChange}
                />

                <AuthInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm New Password"
                    placeholder="Re-type your new password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={handleChange}
                />

                <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={resetForm}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                        Reset
                    </button>

                    <AuthButton
                        type="submit"
                        loading={loading}
                        loadingText="Updating Password..."
                        className="w-auto px-8"
                    >
                        Update Password
                    </AuthButton>
                </div>
            </form>
        </div>
    );
};

export default ChangePasswordForm;
