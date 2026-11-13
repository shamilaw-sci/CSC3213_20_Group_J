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
export const fetchRecommendedProducts = async (limit = 8, sessionId = null) => {
  try {
    const sessionQuery = sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : '';
    const response = await apiClient.get(`/recommendations/personalized?limit=${limit}${sessionQuery}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};

/**
 * Fetch similar products based on multi-attribute content filtering (brand, category, tags, specs, price)
 */
export const fetchSimilarProducts = async (productId, limit = 8) => {
  try {
    const response = await apiClient.get(`/recommendations/similar/${productId}?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return [];
  }
};

/**
 * Fetch Frequently Bought Together (FBT) bundled products with bundle discount
 */
export const fetchFrequentlyBoughtTogether = async (productId, limit = 3) => {
  try {
    const response = await apiClient.get(`/recommendations/frequently-bought-together/${productId}?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching frequently bought together:", error);
    return null;
  }
};

/**
 * Fetch time-decayed trending products
 */
export const fetchTrendingProducts = async (days = 30, limit = 8) => {
  try {
    const response = await apiClient.get(`/recommendations/trending?days=${days}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching trending products:", error);
    return [];
  }
};

/**
 * Fetch recently viewed products for the current user/session
 */
export const fetchRecentlyViewed = async (limit = 8, sessionId = null) => {
  try {
    const sessionQuery = sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : '';
    const response = await apiClient.get(`/recommendations/recently-viewed?limit=${limit}${sessionQuery}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recently viewed products:", error);
    return [];
  }
};

/**
 * Track user interaction (view, cart add) asynchronously
 */
export const trackProductView = async (productId, sessionId = null, interactionType = 'VIEW') => {
  try {
    await apiClient.post('/recommendations/track-view', {
      productId,
      sessionId,
      interactionType,
    });
  } catch (error) {
    // Non-blocking telemetry
    console.debug("View tracking skipped:", error?.message);
  }
};

/**
 * Fetch budget-aware recommendations within price range
 */
export const fetchBudgetAware = async (maxPrice = null, minPrice = null, category = null, limit = 8) => {
  try {
    const params = new URLSearchParams();
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (minPrice) params.append('minPrice', minPrice);
    if (category) params.append('category', category);
    params.append('limit', limit);
    const response = await apiClient.get(`/recommendations/budget-aware?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching budget-aware recommendations:", error);
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
