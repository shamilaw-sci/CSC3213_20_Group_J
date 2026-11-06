import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../../../lib/axios';
import { useAuth } from '../../auth/context/AuthContext';

export const useReviews = (productId) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const page = useRef(0);
    const busy = useRef(false);
    const generation = useRef(0);
    const { user } = useAuth();
    const load = useCallback(async (nextPage = 0) => {
        const current = generation.current;
        if (busy.current) return;
        busy.current = true; setLoading(true); setError(null);
        try {
            const { data } = await apiClient.get('/products/' + productId + '/reviews', { params: { page: nextPage, size: 10 } });
            if (current !== generation.current) return;
            setReviews(prev => nextPage === 0 ? data.content : [...prev, ...data.content.filter(r => !prev.some(p => p.id === r.id))]);
            page.current = nextPage; setHasMore(!data.last);
        } catch (err) {
            if (current === generation.current) setError(err.response?.data?.message || 'Failed to load reviews. Please retry.');
        } finally {
            if (current === generation.current) { busy.current = false; setLoading(false); }
        }
    }, [productId]);
    useEffect(() => {
        generation.current++; const effectGeneration = generation.current; busy.current = false; page.current = 0; setReviews([]); setHasMore(false);
        load(0);
        return () => { generation.current = effectGeneration + 1; busy.current = false; };
    }, [load]);
    const submitReview = async (rating, comment, reviewId) => {
        const url = '/products/' + productId + '/reviews';
        try {
            const { data } = reviewId ? await apiClient.put(url + '/' + reviewId, { rating, comment }) : await apiClient.post(url, { rating, comment });
            await load(0); return data;
        } catch (err) { throw new Error(err.response?.data?.message || 'Failed to save review'); }
    };
    const deleteReview = async (reviewId) => {
        try { await apiClient.delete('/products/' + productId + '/reviews/' + reviewId); await load(0); }
        catch (err) { throw new Error(err.response?.data?.message || 'Failed to delete review'); }
    };
    return { reviews, loading, error, submitReview, deleteReview, user, isAuthenticated: !!user, loadMoreReviews: () => load(page.current + 1), retry: () => load(page.current), hasMore };
};
