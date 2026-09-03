import React, { useState } from 'react';
import { useReviews } from '../hooks/useReviews';
import { Star, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReviewSection = ({ productId }) => {
  const { reviews, loading, error, submitReview, isAuthenticated, loadMoreReviews, hasMore } = useReviews(productId);
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitReview(rating, comment);
      setComment('');
      setRating(5);
      setShowForm(false);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (count) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} className={`w-5 h-5 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
    ));
  };

  if (loading) return <div className="text-center p-8">Loading reviews...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="mb-20 bg-[#F6F6F6] p-8 md:p-12 rounded-[32px]">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-black" />
            <h3 className="text-3xl font-bold text-black">Customer Reviews</h3>
        </div>
        {!showForm && (
            <button 
                onClick={() => isAuthenticated ? setShowForm(true) : navigate('/login')}
                className="bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-md"
            >
                Write a Review
            </button>
        )}
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl mb-10 shadow-sm border border-gray-200">
          <h4 className="font-bold text-lg mb-4">Share your thoughts</h4>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="font-medium text-gray-700 mr-2">Rating:</span>
            {[1, 2, 3, 4, 5].map((num) => (
              <button 
                key={num} 
                type="button" 
                onClick={() => setRating(num)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star className={`w-8 h-8 ${rating >= num ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike about this product?"
            className="w-full p-4 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-black outline-none resize-none"
            rows="4"
          />

          {submitError && <div className="text-red-500 mb-4 font-medium">{submitError}</div>}

          <div className="flex gap-3 justify-end">
            <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-6 py-3 font-bold text-gray-500 hover:text-black transition-colors"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                disabled={isSubmitting || comment.trim().length < 5}
                className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 disabled:bg-gray-300 transition-colors shadow-md"
            >
                {isSubmitting ? 'Posting...' : 'Post Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-gray-500 font-medium italic text-lg py-8 text-center bg-white rounded-2xl border border-gray-100">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <div>
                    <h5 className="font-black text-xl text-black mb-1">{review.title}</h5>
                    <div className="flex gap-1 mb-2">
                        {renderStars(review.rating)}
                    </div>
                </div>
                <span className="text-sm text-gray-400 font-medium">
                  {new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              
              <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 uppercase">
                    {review.authorName.charAt(0)}
                </div>
                <span className="text-sm font-bold text-gray-600">By {review.authorName}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination: Load More */}
      {hasMore && reviews.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMoreReviews}
            disabled={loading}
            className="px-8 py-3 bg-white border border-gray-200 font-bold text-gray-700 rounded-full shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
