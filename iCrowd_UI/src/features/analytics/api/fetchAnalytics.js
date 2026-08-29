import { apiClient } from '../../../lib/axios';

/**
 * Fetches comprehensive AI analytics summary from the Spring Boot backend.
 */
export const fetchAnalyticsSummary = async () => {
  try {
    const response = await apiClient.get('/analytics/summary');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch analytics summary:', error);
    throw error;
  }
};
