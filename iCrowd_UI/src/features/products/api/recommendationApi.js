import { apiClient } from '../../../lib/axios';

/**
 * Fetch top-selling products in recent times (Featured section)
 */
export const fetchFeaturedProducts = async (limit = 8) => {
  try {
    const response = await apiClient.get(`/products/featured?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
};

/**
 * Fetch newly added active products (Latest section)
 */
export const fetchLatestProducts = async (limit = 8) => {
  try {
    const response = await apiClient.get(`/products/latest?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching latest products:", error);
    return [];
  }
};

/**
 * Fetch personalized recommendations (Customer sales record / cart + high-rated fallback)
 */
export const fetchRecommendedProducts = async (limit = 8) => {
  try {
    const response = await apiClient.get(`/products/recommendations?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};

/**
 * Fetch similar products based on the current product & customer context
 */
export const fetchSimilarProducts = async (productId, limit = 8) => {
  try {
    const response = await apiClient.get(`/products/${productId}/similar?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return [];
  }
};

/**
 * Fetch cart-based product suggestions (based on items in cart + customer context)
 */
export const fetchCartSuggestions = async (productIds = [], limit = 8) => {
  try {
    const query = productIds && productIds.length > 0
      ? `?productIds=${productIds.join(',')}&limit=${limit}`
      : `?limit=${limit}`;
    const response = await apiClient.get(`/products/cart-suggestions${query}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cart suggestions:", error);
    return [];
  }
};
