import { apiClient } from '../../../lib/axios';

export const getAllUsers = async (page = 0, size = 20, search = '', role = '') => {
    const params = { page, size };
    if (search) params.search = search;
    if (role) params.role = role;
    const response = await apiClient.get('/admin/users', { params });
    return response.data; // Page<AdminUserSummaryDto>
};

export const getDashboardData = async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
};

export const promoteUser = async (id, password) => {
    const response = await apiClient.patch(`/admin/users/${id}/promote`, { password });
    return response.data;
};

export const demoteUser = async (id) => {
    const response = await apiClient.patch(`/admin/users/${id}/demote`);
    return response.data;
};

export const deactivateUser = async (id) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
};

export const reactivateUser = async (id) => {
    const response = await apiClient.patch(`/admin/users/${id}/reactivate`);
    return response.data;
};

// Keep old name as alias for backward compat
export const deleteUser = deactivateUser;
