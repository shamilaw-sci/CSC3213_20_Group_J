import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProductById } from '../api/fetchProductById';

export const useProductDetail = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentId = useRef(id);
  useEffect(() => { currentId.current = id; }, [id]);
  const refresh = useCallback(async () => {
    try { const data = await fetchProductById(id); if (currentId.current === id) setProduct(data); }
    catch { setError('Failed to refresh product details. Please reload.'); }
  }, [id]);
  useEffect(() => {
    let active = true;
    if (!id) return;
    
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await fetchProductById(id);
        if (!active) return;
        setProduct(data);
        setError(null);
      } catch {
        if (active) setError('Failed to load product details.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProduct();
    return () => { active = false; };
  }, [id]);

  return { product, loading, error, refresh };
};
