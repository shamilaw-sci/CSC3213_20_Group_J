import { apiClient } from '../../../lib/axios';

export const loginUser = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials, { skipAuth: true });
    return response.data;
};

export const registerUser = async (userData) => {
    const response = await apiClient.post('/auth/register', userData, { skipAuth: true });
    return response.data;
};

export const registerAdmin = async (adminData) => {
    const { currentPassword, ...account } = adminData;
    const response = await apiClient.post('/auth/register-admin', account, { headers: { 'X-Admin-Password': currentPassword } });
    return response.data;
};

export const logoutUser = async () => {
    try {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    } catch {
        // Fallback gracefully if network/offline
        return null;
    }
};

export const getCurrentUser = async (token) => {
    const response = await apiClient.get('/auth/me', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    return response.data;
};
