import { useState } from 'react';
import { changePassword } from '../api/userApi';

/**
 * Custom Hook: useChangePassword
 * Handles password change form state, validation, and API submission.
 */
export const useChangePassword = (onSuccess) => {
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError(null);
        setSuccessMessage('');

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setError('Please fill in all password fields.');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setSuccessMessage(res.message || 'Password changed successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            if (onSuccess) onSuccess();
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setError(null);
        setSuccessMessage('');
    };

    return {
        passwordData,
        loading,
        error,
        successMessage,
        handleChange,
        handleSubmit,
        resetForm
    };
};

export default useChangePassword;
