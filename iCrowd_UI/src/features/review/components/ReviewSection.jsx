import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReviews } from '../hooks/useReviews';

export default function ReviewSection({ productId, onChanged }) {
  const { reviews, loading, error, submitReview, deleteReview, user, loadMoreReviews, retry, hasMore } = useReviews(productId);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const reset = () => { setEditing(null); setRating(5); setComment(''); setShowForm(false); };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await submitReview(rating, comment.trim(), editing); reset(); setMessage('Review saved.'); await onChanged?.(); }
    catch (err) { setMessage(err.message); } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    setBusy(true); setMessage('');
    try { await deleteReview(id); reset(); setMessage('Review deleted.'); await onChanged?.(); }
    catch (err) { setMessage(err.message); } finally { setBusy(false); }
  };
  return <section id="reviews" className="mb-12 bg-[#F6F6F6] p-6 md:p-10 rounded-[32px]">
    <h2 className="text-2xl font-bold mb-3">Customer Reviews</h2>
    <p className="text-gray-600 mb-4">One review per product, after your order is confirmed. You can edit your review later.</p>
    {user ? <button disabled={busy || loading} className="rounded-full bg-black text-white px-5 py-2 mb-4" onClick={() => { reset(); setShowForm(true); }}>Write a Review</button> : <Link className="underline" to="/login">Sign in to write a review</Link>}
    {showForm && <form onSubmit={submit} className="bg-white p-5 rounded-xl mb-5 space-y-3">
      <h3 className="font-bold">{editing ? 'Edit review' : 'Write a review'}</h3>
      <label className="block">Rating <select aria-label="Rating" className="border rounded p-2 ml-2" value={rating} onChange={e => setRating(Number(e.target.value))}>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} {n === 1 ? 'star' : 'stars'}</option>)}</select></label>
      <label className="block">Your review<textarea aria-label="Your review" className="block border rounded p-3 w-full mt-1" rows={4} minLength={5} maxLength={1000} required value={comment} onChange={e => setComment(e.target.value)} /></label>
      <p className="text-sm text-gray-500">{comment.length}/1000 characters</p>
      <button disabled={busy || loading || comment.trim().length < 5} className="bg-black text-white rounded px-4 py-2 disabled:opacity-50">{busy ? 'Saving...' : 'Save review'}</button>
      <button type="button" disabled={busy || loading} className="ml-4" onClick={reset}>Cancel</button>
    </form>}
    {message && <p role="status" className="my-3">{message}</p>}
    {error && <p role="alert" className="text-red-700 my-3">{error} <button onClick={retry} className="underline">Retry</button></p>}
    {!loading && !error && reviews.length === 0 && <p className="py-4 text-gray-600">No reviews yet. Be the first to review this product!</p>}
    <div className="space-y-4">{reviews.map(review => <article key={review.id} className="bg-white p-5 rounded-xl">
      <p aria-label={review.rating + ' out of 5 stars'} className="text-amber-600 text-xl">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</p>
      <p className="font-semibold">{review.authorName} <span className="text-gray-500 text-sm font-normal">· {new Date(review.createdAt).toLocaleDateString()}</span></p>
      <p className="whitespace-pre-wrap break-words my-3">{review.comment}</p>
      {user && String(user.id) === String(review.userId) && <button disabled={busy || loading} className="underline mr-4" onClick={() => { setEditing(review.id); setRating(review.rating); setComment(review.comment); setShowForm(true); }}>Edit review</button>}
      {user && (String(user.id) === String(review.userId) || user.role === 'ADMIN') && <button disabled={busy || loading} className="text-red-700 underline" onClick={() => remove(review.id)}>Delete review</button>}
    </article>)}</div>
    {loading && <p role="status" className="py-4">Loading reviews...</p>}
    {hasMore && <button disabled={loading || busy} onClick={loadMoreReviews} className="mt-5 underline">Load More Reviews</button>}
  </section>;
}
