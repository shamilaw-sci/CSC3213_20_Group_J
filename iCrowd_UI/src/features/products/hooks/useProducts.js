import { useState, useEffect } from 'react';
import { fetchProducts } from '../api/fetchProducts';

export const useProducts = (keyword = '', category = '', sort = '', page = 0, size = 10, extra = {}) => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const extraKey = JSON.stringify(extra);
  const requestKey = JSON.stringify([keyword, category, sort, page, size, extraKey]);
  const [settledKey, setSettledKey] = useState(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts(keyword, category, sort, page, size, JSON.parse(extraKey), controller.signal);
        
        if (!active) return;
        // Spring Data JPA returns the array in "content"
        setProducts(data.content || []);
        
        // Save the metadata for our pagination UI
        setPagination({
          totalPages: data.totalPages || 0,
          totalElements: data.totalElements || 0,
          number: data.number || 0,
          size: data.size || 10
        });
        
        setError(null);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load products. Please try again.');
      } finally {
        if (active) { setLoading(false); setSettledKey(requestKey); }
      }
    };

    loadProducts();
    return () => { active = false; controller.abort(); };
  }, [keyword, category, sort, page, size, extraKey, requestKey]);

  return { products, pagination, loading: loading || settledKey !== requestKey, error };
};
