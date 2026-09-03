import { useState, useEffect } from 'react';
import { fetchUserProfile, updateUserProfile } from '../api/userApi';
import { useAuth } from '../../auth/hooks/useAuth';

/**
 * Custom Hook: useUserProfile
 * Handles user profile fetching, updating, state management, and synchronization.
 */
export const useUserProfile = () => {
    const { user: authUser, updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        district: '',
        city: ''
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const loadProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchUserProfile();
            setProfile(data);
            setFormData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                phone: data.phone || '',
                address: data.address || '',
                district: data.district || '',
                city: data.city || ''
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load profile details.');
            // Fallback to authUser if available
            if (authUser) {
                setProfile(authUser);
                setFormData({
                    firstName: authUser.firstName || '',
                    lastName: authUser.lastName || '',
                    phone: authUser.phone || '',
                    address: authUser.address || '',
                    district: authUser.district || '',
                    city: authUser.city || ''
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setUpdating(true);
        setError(null);
        setSuccessMessage('');

        if (!formData.firstName || !formData.lastName || !formData.phone) {
            setError('Please fill in required fields (First Name, Last Name, Phone Number).');
            setUpdating(false);
            return;
        }

        try {
            const result = await updateUserProfile(formData);
            const updatedUser = result.user || result;
            setProfile(updatedUser);
            if (updateUser) {
                updateUser(updatedUser);
            }
            setSuccessMessage('Profile updated successfully!');
            setIsEditing(false);
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setUpdating(false);
        }
    };

    const cancelEdit = () => {
        if (profile) {
            setFormData({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone || '',
                address: profile.address || '',
                district: profile.district || '',
                city: profile.city || ''
            });
        }
        setIsEditing(false);
        setError(null);
    };

    return {
        profile: profile || authUser,
        formData,
        loading,
        updating,
        error,
        successMessage,
        isEditing,
        setIsEditing,
        handleChange,
        handleSave,
        cancelEdit,
        refreshProfile: loadProfile
    };
};

export default useUserProfile;
