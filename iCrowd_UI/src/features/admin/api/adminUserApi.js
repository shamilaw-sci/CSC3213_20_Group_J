import { apiClient } from '../../../lib/axios';

export const getAllUsers = async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
};

export const getDashboardData = async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
};

export const promoteUser = async (id) => {
    const response = await apiClient.patch(`/admin/users/${id}/promote`);
    return response.data;
};

export const demoteUser = async (id) => {
    const response = await apiClient.patch(`/admin/users/${id}/demote`);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data;
};
