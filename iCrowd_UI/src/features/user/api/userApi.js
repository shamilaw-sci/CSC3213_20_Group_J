import { apiClient } from '../../../lib/axios';

/**
 * Fetch current user profile details.
 */
export const fetchUserProfile = async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
};

/**
 * Update current user profile details (first name, last name, phone, address, etc.)
 */
export const updateUserProfile = async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
};

/**
 * Change current user password.
 */
export const changePassword = async (passwordData) => {
    const response = await apiClient.put('/users/change-password', passwordData);
    return response.data;
};
