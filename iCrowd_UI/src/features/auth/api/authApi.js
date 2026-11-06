import { apiClient } from '../../../lib/axios';

export const loginUser = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};

export const registerUser = async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
};

export const registerAdmin = async (adminData) => {
    const response = await apiClient.post('/auth/register-admin', adminData);
    return response.data;
};

export const logoutUser = async () => {
    try {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    } catch (e) {
        // Fallback gracefully if network/offline
        return null;
    }
};

export const getCurrentUser = async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
};
