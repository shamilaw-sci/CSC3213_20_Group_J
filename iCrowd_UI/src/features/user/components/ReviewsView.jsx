import React, { useState } from 'react';

/**
 * ReviewsView Component
 * Displays customer reviews and items pending review.
 */
const ReviewsView = () => {
    const [subTab, setSubTab] = useState('history');

    const reviews = [
        {
            id: 'REV-1',
            product: 'Ergonomic Mechanical Keyboard (Brown Switch)',
            date: '14 August 2026',
            rating: 5,
            comment: 'Fantastic build quality and super comfortable for long typing sessions. Highly recommend!',
            seller: 'TechWorld Official Store'
        }
    ];

    return (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-base font-bold text-gray-900">My Reviews</h3>
                    <p className="text-xs text-gray-500">Rate and write feedback on your purchased products</p>
                </div>
            </div>

            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 text-xs font-semibold">
                <button
                    type="button"
                    onClick={() => setSubTab('history')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        subTab === 'history' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black hover:bg-gray-100'
                    }`}
                >
                    Reviewed History ({reviews.length})
                </button>
                <button
                    type="button"
                    onClick={() => setSubTab('pending')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                        subTab === 'pending' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black hover:bg-gray-100'
                    }`}
                >
                    To Review (1)
                </button>
            </div>

            {subTab === 'history' ? (
                <div className="space-y-4">
                    {reviews.map(rev => (
                        <div key={rev.id} className="border border-gray-100 rounded-xl p-4 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-900">{rev.product}</span>
                                <span className="text-gray-400">{rev.date}</span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-400">
                                {'★'.repeat(rev.rating)}
                                <span className="text-gray-400 text-[11px] ml-1">({rev.rating}.0)</span>
                            </div>
                            <p className="text-gray-700">{rev.comment}</p>
                            <p className="text-[11px] text-gray-400">Purchased from: {rev.seller}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="border border-gray-100 rounded-xl p-4 text-xs flex items-center justify-between">
                    <div>
                        <p className="font-bold text-gray-900">Wireless Noise-Cancelling Headphones</p>
                        <p className="text-gray-500">Delivered on 20 August 2026</p>
                    </div>
                    <button className="px-4 py-1.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 cursor-pointer">
                        Write Review
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReviewsView;
