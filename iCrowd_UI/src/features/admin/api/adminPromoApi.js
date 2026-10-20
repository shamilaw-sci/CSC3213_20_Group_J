import { apiClient } from '../../../lib/axios';

export const getAllPromoCodes = async () => {
    const response = await apiClient.get('/promo');
    return response.data;
};

export const getPromoStats = async () => {
    const response = await apiClient.get('/promo/stats');
    return response.data;
};

export const createPromoCode = async (payload) => {
    const response = await apiClient.post('/promo', payload);
    return response.data;
};

export const updatePromoCode = async (id, payload) => {
    const response = await apiClient.put(`/promo/${id}`, payload);
    return response.data;
};

export const togglePromoCode = async (id) => {
    const response = await apiClient.patch(`/promo/${id}/toggle`);
    return response.data;
};

export const deletePromoCode = async (id) => {
    const response = await apiClient.delete(`/promo/${id}`);
    return response.data;
};
