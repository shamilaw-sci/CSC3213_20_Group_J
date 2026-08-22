import { useState, useEffect, useCallback } from 'react';
import { fetchProductReviews, submitProductReview } from '../api/reviewApi';
import { useAuth } from '../../auth/context/AuthContext';

export const useReviews = (productId) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { user } = useAuth(); // Need to check if user is logged in to allow submitting

    const loadReviews = useCallback(async (pageNum) => {
        try {
            if (pageNum === 0) setLoading(true);
            const data = await fetchProductReviews(productId, pageNum, 10);
            
            setReviews(prev => pageNum === 0 ? data.content : [...prev, ...data.content]);
            setHasMore(!data.last); // Spring Data JPA Page object has a 'last' boolean
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        if (productId) {
            setPage(0);
            loadReviews(0);
        }
    }, [productId, loadReviews]);

    const loadMoreReviews = () => {
        if (!hasMore || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadReviews(nextPage);
    };

    const submitReview = async (rating, comment) => {
        if (!user) {
            throw new Error("You must be logged in to leave a review.");
        }
        
        try {
            const data = await submitProductReview(productId, rating, comment);
            // Instantly add the new review to the top of the list
            setReviews(prev => [data, ...prev]);
            return data;
        } catch (err) {
            throw new Error(err.response?.data?.message || 'Failed to submit review');
        }
    };

    return { reviews, loading, error, submitReview, isAuthenticated: !!user, loadMoreReviews, hasMore };
};
