import { apiClient } from '../../../lib/axios';

/**
 * Fetch paginated orders with optional search and status filter
 */
export const getAdminOrders = async (page = 0, size = 20, search = '', status = '') => {
    const params = { page, size };
    if (search) params.search = search;
    if (status) params.status = status;
    const response = await apiClient.get('/admin/orders', { params });
    return response.data; // Page<AdminOrderSummaryDto>
};

/**
 * Fetch complete order details
 */
export const getAdminOrderById = async (id) => {
    const response = await apiClient.get(`/admin/orders/${id}`);
    return response.data;
};

/**
 * Update order fulfillment status ("where the order is now")
 */
export const updateAdminOrderStatus = async (id, status, note = '') => {
    const response = await apiClient.patch(`/admin/orders/${id}/status`, { status, note });
    return response.data;
};

/**
 * Fetch order dashboard statistics
 */
export const getAdminOrderStats = async () => {
    const response = await apiClient.get('/admin/orders/stats');
    return response.data;
};
