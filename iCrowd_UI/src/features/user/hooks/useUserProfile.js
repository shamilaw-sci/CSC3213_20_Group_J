import { useState, useEffect, useEffectEvent } from 'react';
import { fetchUserProfile, updateUserProfile } from '../api/userApi';
import { useAuth } from '../../auth/hooks/useAuth';

/**
 * Custom Hook: useUserProfile
 * Handles user profile fetching, updating, state management, and validation.
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
        city: '',
        province: '',
        postalCode: '',
        dateOfBirth: '',
        profileImage: ''
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
                city: data.city || '',
                province: data.province || '',
                postalCode: data.postalCode || '',
                dateOfBirth: data.dateOfBirth || '',
                profileImage: data.profileImage || ''
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load profile details.');
            if (authUser) {
                setProfile(authUser);
                setFormData({
                    firstName: authUser.firstName || '',
                    lastName: authUser.lastName || '',
                    phone: authUser.phone || '',
                    address: authUser.address || '',
                    district: authUser.district || '',
                    city: authUser.city || '',
                    province: authUser.province || '',
                    postalCode: authUser.postalCode || '',
                    dateOfBirth: authUser.dateOfBirth || '',
                    profileImage: authUser.profileImage || ''
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const initialLoad = useEffectEvent(() => loadProfile());
    useEffect(() => {
        initialLoad();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const validateProfile = () => {
        const trimmedFirst = formData.firstName.trim();
        const trimmedLast = formData.lastName.trim();
        const trimmedPhone = formData.phone.trim();

        if (!trimmedFirst || !trimmedLast || !trimmedPhone) {
            return 'Please fill in required fields (First Name, Last Name, Phone Number).';
        }

        if (trimmedFirst.length > 50) {
            return 'First name must not exceed 50 characters.';
        }
        if (trimmedLast.length > 50) {
            return 'Last name must not exceed 50 characters.';
        }

        const cleanPhone = trimmedPhone.replace(/[\s-]/g, '');
        if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
            return 'Phone number must contain 7 to 15 digits (e.g. +94771234567 or 0771234567).';
        }

        if (formData.address && formData.address.length > 255) {
            return 'Address must not exceed 255 characters.';
        }
        if (formData.city && formData.city.length > 100) {
            return 'City must not exceed 100 characters.';
        }
        if (formData.district && formData.district.length > 100) {
            return 'District must not exceed 100 characters.';
        }
        if (formData.province && formData.province.length > 100) {
            return 'Province must not exceed 100 characters.';
        }
        if (formData.postalCode && formData.postalCode.length > 20) {
            return 'Postal code must not exceed 20 characters.';
        }
        if (formData.postalCode && !/^[0-9A-Za-z -]{0,20}$/.test(formData.postalCode)) {
            return 'Invalid postal code format.';
        }

        if (formData.dateOfBirth) {
            const dob = new Date(formData.dateOfBirth);
            const now = new Date();
            if (dob >= now) {
                return 'Birth date must be in the past.';
            }
        }

        if (formData.profileImage && formData.profileImage.length > 2048) {
            return 'Profile image URL must not exceed 2048 characters.';
        }
        if (formData.profileImage && !/^(https?:\/\/.*)?$/.test(formData.profileImage)) {
            return 'Profile image must be a valid HTTP or HTTPS URL.';
        }

        return null;
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setUpdating(true);
        setError(null);
        setSuccessMessage('');

        const validationError = validateProfile();
        if (validationError) {
            setError(validationError);
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
                city: profile.city || '',
                province: profile.province || '',
                postalCode: profile.postalCode || '',
                dateOfBirth: profile.dateOfBirth || '',
                profileImage: profile.profileImage || ''
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
