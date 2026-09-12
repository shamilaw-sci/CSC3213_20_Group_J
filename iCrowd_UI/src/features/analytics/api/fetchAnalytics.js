import { apiClient } from '../../../lib/axios';

/**
 * Fetches comprehensive AI analytics summary from the Spring Boot backend with optional date range filters.
 * @param {Object} params - { range: string, startDate?: string, endDate?: string }
 */
export const fetchAnalyticsSummary = async (params = {}) => {
  try {
    const cleanParams = {};
    if (params.range) cleanParams.range = params.range;
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;

    const response = await apiClient.get('/analytics/summary', { params: cleanParams });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch analytics summary:', error);
    throw error;
  }
};

