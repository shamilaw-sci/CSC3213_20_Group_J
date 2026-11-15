import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Custom hook containing all business logic and state for User/Admin login.
 */
export const useLoginForm = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [formError, setFormError] = useState('');
    const { login, loading, error: authError } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
        if (formError) setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!credentials.email || !credentials.password) {
            setFormError('Please fill in all required fields.');
            return;
        }

        try {
            const user = await login(credentials);
            if (['ADMIN', 'INVENTORY_MANAGER'].includes(user?.role)) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch {
            // Error handled by AuthContext and exposed via authError
        }
    };

    return {
        credentials,
        loading,
        error: formError || authError,
        handleChange,
        handleSubmit
    };
};

export default useLoginForm;
