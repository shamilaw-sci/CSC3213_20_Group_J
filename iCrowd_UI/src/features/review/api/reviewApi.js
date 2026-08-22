import { apiClient } from '../../../lib/axios';

export const fetchProductReviews = async (productId, page = 0, size = 10) => {
    const response = await apiClient.get(`/products/${productId}/reviews?page=${page}&size=${size}`);
    return response.data;
};

export const submitProductReview = async (productId, rating, comment) => {
    const response = await apiClient.post(`/products/${productId}/reviews`, {
        rating,
        comment
    });
    return response.data;
};
