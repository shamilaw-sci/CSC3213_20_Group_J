import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Custom hook containing all business logic and state for Customer Registration.
 * Customer registration is strictly restricted to role: 'CUSTOMER'.
 */
export const useRegisterForm = () => {
    const initialFormState = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        district: '',
        city: '',
        role: 'CUSTOMER' // Strictly Customer
    };

    const [formData, setFormData] = useState(initialFormState);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { register, loading, error: authError } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Prevent modifying role
        if (name === 'role') return;

        setFormData(prev => ({ ...prev, [name]: value }));
        if (formError) setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');

        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone) {
            setFormError('Please fill in all required fields.');
            return;
        }

        if (formData.password.length < 8) {
            setFormError('Password must be at least 8 characters long.');
            return;
        }

        try {
            await register({
                ...formData,
                role: 'CUSTOMER' // Enforce Customer role
            });
            setSuccessMessage('Registration successful! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch {
            // Error handled by AuthContext and exposed via authError
        }
    };

    return {
        formData,
        loading,
        error: formError || authError,
        successMessage,
        handleChange,
        handleSubmit
    };
};

export default useRegisterForm;
