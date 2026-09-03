import { apiClient } from '../../../lib/axios';

/**
 * Fetch current user profile details.
 */
export const fetchUserProfile = async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
};

/**
 * Update current user profile details (first name, last name, phone, etc.)
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

/**
 * Fetch all saved delivery addresses for the logged-in customer.
 */
export const fetchUserAddresses = async () => {
    const response = await apiClient.get('/users/addresses');
    return response.data;
};

/**
 * Add a new delivery address for the logged-in customer.
 */
export const createUserAddress = async (addressData) => {
    const response = await apiClient.post('/users/addresses', addressData);
    return response.data;
};

/**
 * Update an existing delivery address.
 */
export const updateUserAddress = async (id, addressData) => {
    const response = await apiClient.put(`/users/addresses/${id}`, addressData);
    return response.data;
};

/**
 * Delete a delivery address.
 */
export const deleteUserAddress = async (id) => {
    const response = await apiClient.delete(`/users/addresses/${id}`);
    return response.data;
};

/**
 * Set a delivery address as primary default.
 */
export const setDefaultUserAddress = async (id) => {
    const response = await apiClient.put(`/users/addresses/${id}/default`);
    return response.data;
};
