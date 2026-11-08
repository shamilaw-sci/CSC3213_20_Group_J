import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/axios';

/**
 * ReviewsView Component
 * Displays real customer reviews and products awaiting review from confirmed purchases.
 */
export default function ReviewsView() {
    const [tab, setTab] = useState('history');
    const [reviews, setReviews] = useState([]);
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        Promise.all([
            apiClient.get('/users/me/reviews'),
            apiClient.get('/users/me/reviews/pending')
        ])
            .then(([historyRes, eligibleRes]) => {
                if (active) {
                    setReviews(Array.isArray(historyRes.data) ? historyRes.data : []);
                    setPending(Array.isArray(eligibleRes.data) ? eligibleRes.data : []);
                }
            })
            .catch((err) => {
                if (active) {
                    console.error("Failed to load reviews:", err);
                    setError('Could not load your reviews. Please retry.');
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [attempt]);

    const renderStars = (rating) => {
        return (
            <div className="flex items-center text-amber-400 text-sm">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>{star <= rating ? '★' : '☆'}</span>
                ))}
            </div>
        );
    };

    return (
        <section className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                    <h2 className="text-base font-bold text-gray-900">My Reviews</h2>
                    <p className="text-xs text-gray-500">View and manage your product feedback and ratings</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 text-xs font-semibold">
                <button
                    type="button"
                    onClick={() => setTab('history')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        tab === 'history'
                            ? 'bg-black text-white shadow-sm'
                            : 'text-gray-500 hover:text-black hover:bg-gray-100'
                    }`}
                >
                    Reviewed History ({reviews.length})
                </button>
                <button
                    type="button"
                    onClick={() => setTab('pending')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        tab === 'pending'
                            ? 'bg-black text-white shadow-sm'
                            : 'text-gray-500 hover:text-black hover:bg-gray-100'
                    }`}
                >
                    To Review ({pending.length})
                </button>
            </div>

            {/* Content Body */}
            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mb-2"></div>
                    <span className="text-xs text-gray-500">Loading reviews...</span>
                </div>
            ) : error ? (
                <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-red-600 font-medium" role="alert">{error}</p>
                    <button
                        type="button"
                        onClick={() => setAttempt(n => n + 1)}
                        className="px-4 py-1.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            ) : tab === 'history' ? (
                reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map((r) => (
                            <article key={r.id} className="border border-gray-200/80 rounded-xl p-4 hover:border-gray-300 transition-all space-y-2">
                                <div className="flex items-center justify-between">
                                    <Link
                                        to={`/product/${r.productId}#reviews`}
                                        className="font-bold text-sm text-gray-900 hover:underline"
                                    >
                                        {r.productName || `Product #${r.productId}`}
                                    </Link>
                                    {renderStars(r.rating)}
                                </div>
                                {r.title && (
                                    <h4 className="text-xs font-semibold text-gray-800">{r.title}</h4>
                                )}
                                <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">{r.comment}</p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center space-y-2 text-xs text-gray-500">
                        <div className="text-3xl mb-2">⭐</div>
                        <p className="font-semibold text-gray-700">You haven't reviewed any products yet.</p>
                        <p>Share your product experience once your orders are delivered.</p>
                    </div>
                )
            ) : pending.length > 0 ? (
                <div className="space-y-4">
                    {pending.map((p) => (
                        <article key={p.id} className="border border-gray-200/80 rounded-xl p-4 hover:border-gray-300 transition-all flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-sm text-gray-900">{p.name}</h4>
                                <p className="text-xs text-gray-400">Purchased item ready for review</p>
                            </div>
                            <Link
                                to={`/product/${p.id}#reviews`}
                                className="px-4 py-2 bg-black text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all cursor-pointer"
                            >
                                Write Review
                            </Link>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center space-y-2 text-xs text-gray-500">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="font-semibold text-gray-700">No products awaiting review.</p>
                    <p>Products from confirmed and delivered purchases will appear here for you to rate.</p>
                </div>
            )}
        </section>
    );
}
