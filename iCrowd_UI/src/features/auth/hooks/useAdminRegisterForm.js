import { useState } from 'react';
import { registerAdmin } from '../api/authApi';

/**
 * Custom hook containing business logic for Admins to create new Admin accounts.
 */
export const useAdminRegisterForm = (onSuccess) => {
    const initialFormState = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        currentPassword: '',
        phone: '',
        address: '',
        district: '',
        city: '',
        role: 'ADMIN' // Strictly Admin
    };

    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'role') return;

        setFormData(prev => ({ ...prev, [name]: value }));
        if (formError) setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.currentPassword) {
            setFormError('Please fill in all required fields.');
            return;
        }

        if (formData.password.length < 8) {
            setFormError('Password must be at least 8 characters long.');
            return;
        }

        setLoading(true);
        try {
            await registerAdmin({
                ...formData,
                role: 'ADMIN' // Enforce Admin role
            });
            setSuccessMessage(`Admin account for "${formData.email}" created successfully!`);
            setFormData(initialFormState);
            if (onSuccess) onSuccess();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to create admin account.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setFormError('');
        setSuccessMessage('');
    };

    return {
        formData,
        loading,
        error: formError,
        successMessage,
        handleChange,
        handleSubmit,
        resetForm
    };
};

export default useAdminRegisterForm;
