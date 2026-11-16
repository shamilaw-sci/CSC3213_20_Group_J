import { apiClient } from '../../../lib/axios';

export const fetchSuggestions = async (keyword, signal) => {
  if (!keyword || keyword.trim() === '') return { terms: [], categories: [], products: [] };
  try {
    const response = await apiClient.get(`/products/suggestions`, {
      params: { q: keyword }, signal
    });
    return response.data;
  } catch (error) {
    if (error.code === "ERR_CANCELED") throw error;
    return { terms: [], categories: [], products: [] };
  }
};
