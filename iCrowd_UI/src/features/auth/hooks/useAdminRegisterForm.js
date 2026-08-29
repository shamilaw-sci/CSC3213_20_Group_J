import { useState } from 'react';
import { useAuth } from './useAuth';

/**
 * Custom hook containing business logic for Admins to create new Admin accounts.
 */
export const useAdminRegisterForm = (onSuccess) => {
    const initialFormState = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        district: '',
        city: '',
        role: 'ADMIN' // Strictly Admin
    };

    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { register, loading, error: authError } = useAuth();

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

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            setFormError('Please fill in all required fields.');
            return;
        }

        try {
            await register({
                ...formData,
                role: 'ADMIN' // Enforce Admin role
            });
            setSuccessMessage(`Admin account for "${formData.email}" created successfully!`);
            setFormData(initialFormState);
            if (onSuccess) onSuccess();
        } catch (err) {
            // Error handled by AuthContext
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
        error: formError || authError,
        successMessage,
        handleChange,
        handleSubmit,
        resetForm
    };
};

export default useAdminRegisterForm;
