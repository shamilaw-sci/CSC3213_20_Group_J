import { useState, useEffect, useCallback } from 'react';
import { fetchAnalyticsSummary } from '../api/fetchAnalytics';

/**
 * Custom hook to manage fetching and state for the AI Analytics Dashboard.
 */
export const useAnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAnalyticsSummary();
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load analytics. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh: loadData,
  };
};
