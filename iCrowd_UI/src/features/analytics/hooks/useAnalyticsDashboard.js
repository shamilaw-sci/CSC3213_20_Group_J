import { useState, useEffect, useCallback } from 'react';
import { fetchAnalyticsSummary } from '../api/fetchAnalytics';

/**
 * Custom hook to manage fetching and state for the AI Analytics Dashboard with date range filter support.
 */
export const useAnalyticsDashboard = (initialRange = 'all') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(initialRange);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { range };
      if (range === 'custom' && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }
      const result = await fetchAnalyticsSummary(params);
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load analytics. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, [range, customStartDate, customEndDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplyCustomRange = (start, end) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setRange('custom');
  };

  return {
    data,
    loading,
    error,
    range,
    setRange,
    customStartDate,
    customEndDate,
    applyCustomRange: handleApplyCustomRange,
    refresh: loadData,
  };
};

