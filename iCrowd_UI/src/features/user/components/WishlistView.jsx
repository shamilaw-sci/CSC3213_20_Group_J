import React from 'react';

/**
 * WishlistView Component
 * Displays customer's saved items and followed stores.
 */
const WishlistView = ({ isFollowedStores = false }) => {
    const wishlistItems = [
        {
            id: 1,
            title: '4K Ultra HD Dual Monitor Arm',
            price: 'LKR 14,200',
            originalPrice: 'LKR 16,500',
            inStock: true
        },
        {
            id: 2,
            title: 'USB-C Magnetic Fast Charger Dock',
            price: 'LKR 6,800',
            originalPrice: 'LKR 7,500',
            inStock: true
        }
    ];

    const followedStores = [
        {
            id: 1,
            name: 'iCrowd Flagship Store',
            followers: '14.2k followers',
            rating: '98% Positive Seller Rating'
        },
        {
            id: 2,
            name: 'GadgetZone Sri Lanka',
            followers: '8.7k followers',
            rating: '96% Positive Seller Rating'
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
                        {isFollowedStores ? 'Stores and sellers you are following' : 'Saved items for later purchase'}
                    </p>
                </div>
            </div>

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
                            <button className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                                Visiting Store
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistItems.map(item => (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between">
                            <div>
                                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-2xl mb-3">
                                    🛍️
                                </div>
                                <h4 className="font-semibold text-xs text-gray-900 mb-1">{item.title}</h4>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-sm text-gray-900">{item.price}</span>
                                    <span className="text-xs text-gray-400 line-through">{item.originalPrice}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                <button className="flex-1 bg-black text-white text-xs font-semibold py-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                                    Add to Cart
                                </button>
                                <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg border border-gray-200">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WishlistView;
