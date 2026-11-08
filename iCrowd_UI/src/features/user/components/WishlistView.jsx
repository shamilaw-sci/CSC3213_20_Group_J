import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/axios';
import { useCart } from '../../cart/hooks/CartContext';

/**
 * WishlistView Component
 * Displays real customer saved products and followed stores.
 */
const WishlistView = ({ isFollowedStores = false }) => {
    const { addToCart } = useCart();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');

    const loadWishlist = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/wishlist');
            if (Array.isArray(res.data)) {
                setWishlistItems(res.data);
            } else {
                setWishlistItems([]);
            }
        } catch (err) {
            console.error("Failed to load wishlist:", err);
            setError(err.response?.data?.message || 'Could not load your wishlist.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isFollowedStores) {
            loadWishlist();
        } else {
            setLoading(false);
        }
    }, [isFollowedStores]);

    const handleRemove = async (productId) => {
        try {
            await apiClient.delete(`/wishlist/${productId}`);
            setWishlistItems(prev => prev.filter(item => item.product?.id !== productId));
            setFeedback('Item removed from wishlist');
            setTimeout(() => setFeedback(''), 3000);
        } catch (err) {
            console.error("Failed to remove item from wishlist:", err);
            setError('Could not remove item. Please try again.');
        }
    };

    const handleAddToCart = (product) => {
        if (!product) return;
        addToCart(product);
        setFeedback(`Added "${product.name}" to cart`);
        setTimeout(() => setFeedback(''), 3000);
    };

    const followedStores = [
        {
            id: 'official-icrowd',
            name: 'iCrowd Official Flagship Store',
            followers: '14.5k followers',
            rating: '100% Genuine Products Guarantee',
            category: 'Electronics & Audio'
        }
    ];

    return (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-base font-bold text-gray-900">
                        {isFollowedStores ? 'Followed Stores' : 'My Wishlist'}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {isFollowedStores ? 'Stores and brand sellers you follow' : 'Your saved products for future purchase'}
                    </p>
                </div>
                {!isFollowedStores && wishlistItems.length > 0 && (
                    <span className="text-xs font-semibold text-gray-500">
                        {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
                    </span>
                )}
            </div>

            {feedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl flex items-center gap-2">
                    <span>✓</span>
                    <span>{feedback}</span>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={loadWishlist} className="underline font-bold cursor-pointer">Retry</button>
                </div>
            )}

            {isFollowedStores ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followedStores.map(store => (
                        <div key={store.id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                                    {store.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs text-gray-900">{store.name}</h4>
                                    <p className="text-[11px] text-gray-400">{store.followers}</p>
                                    <p className="text-[10px] text-emerald-600 font-medium">{store.rating}</p>
                                </div>
                            </div>
                            <Link
                                to="/products"
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                            >
                                Visit Store
                            </Link>
                        </div>
                    ))}
                </div>
            ) : loading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mb-2"></div>
                    <span className="text-xs text-gray-500">Loading your wishlist...</span>
                </div>
            ) : wishlistItems.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
                        ❤️
                    </div>
                    <p className="text-sm font-semibold text-gray-800">Your wishlist is currently empty</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Explore our store and tap the heart icon on any product to save it here for later.
                    </p>
                    <Link
                        to="/products"
                        className="inline-block mt-2 px-5 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition-all cursor-pointer"
                    >
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistItems.map(item => {
                        const product = item.product;
                        if (!product) return null;
                        const img = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : '';

                        return (
                            <div key={item.id} className="border border-gray-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-gray-300 transition-all group">
                                <div>
                                    <Link to={`/product/${product.id}`} className="block">
                                        <div className="w-full h-40 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center mb-3 border border-gray-100">
                                            {img ? (
                                                <img
                                                    src={img}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <span className="text-3xl text-gray-300">📦</span>
                                            )}
                                        </div>
                                        <h4 className="font-semibold text-xs text-gray-900 mb-1 line-clamp-2 hover:underline">
                                            {product.name}
                                        </h4>
                                    </Link>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-bold text-sm text-gray-900">
                                            LKR {product.price ? Number(product.price).toLocaleString() : '0.00'}
                                        </span>
                                    </div>
                                    {product.category && (
                                        <span className="inline-block text-[10px] font-semibold text-gray-500 uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded">
                                            {product.category.name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => handleAddToCart(product)}
                                        disabled={product.availableStock <= 0}
                                        className="flex-1 bg-black text-white text-xs font-semibold py-2 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-40 cursor-pointer"
                                    >
                                        {product.availableStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemove(product.id)}
                                        title="Remove from wishlist"
                                        className="p-2 text-gray-400 hover:text-red-600 rounded-xl border border-gray-200 hover:border-red-200 transition-colors cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default WishlistView;
