import { apiClient } from '../../../lib/axios';

export const getAllProductsAdmin = async (page = 0, size = 20, keyword = '', signal) => {
    const response = await apiClient.get(`/products/admin/all?page=${page}&size=${size}&keyword=${encodeURIComponent(keyword)}`, { signal });
    return response.data;
};

export const getProductByIdAdmin = async (id) => {
    const response = await apiClient.get(`/products/admin/${id}`);
    return response.data;
};

export const createProduct = async (productData) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
};

export const updateProduct = async (id, productData) => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
};

export const getProductStats = async () => {
    const response = await apiClient.get('/products/admin/stats');
    return response.data;
};

export const getLowStockProducts = async (threshold = 5) => {
    const response = await apiClient.get(`/products/admin/low-stock?threshold=${threshold}`);
    return response.data;
};

export const getRecentProducts = async (limit = 5) => {
    const response = await apiClient.get(`/products/admin/recent?limit=${limit}`);
    return response.data;
};
