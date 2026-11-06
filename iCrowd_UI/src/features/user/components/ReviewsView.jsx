import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/axios';
export default function ReviewsView() {
  const [tab, setTab] = useState('history');
  const [reviews, setReviews] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([apiClient.get('/users/me/reviews'), apiClient.get('/users/me/reviews/pending')])
      .then(([history, eligible]) => { if (active) { setReviews(history.data); setPending(eligible.data); } })
      .catch(() => { if (active) setError('Could not load your reviews. Please retry.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return <section className="bg-white border rounded-2xl p-6 space-y-4">
    <h2 className="text-xl font-bold">My Reviews</h2>
    <div className="flex gap-4"><button className={tab === 'history' ? 'font-bold underline' : ''} onClick={() => setTab('history')}>Reviewed History ({reviews.length})</button><button className={tab === 'pending' ? 'font-bold underline' : ''} onClick={() => setTab('pending')}>To Review ({pending.length})</button></div>
    {loading ? <p>Loading reviews...</p> : error ? <p role="alert">{error} <button className="underline" onClick={() => { setLoading(true); setError(''); setAttempt(n => n + 1); }}>Retry</button></p> : tab === 'history' ? reviews.length ? reviews.map(r => <article key={r.id} className="border rounded-xl p-4"><Link className="font-bold underline" to={'/product/' + r.productId + '#reviews'}>{r.productName}</Link><p>{r.rating} / 5 stars</p><p className="whitespace-pre-wrap break-words">{r.comment}</p></article>) : <p>You have not reviewed any products yet.</p> : pending.length ? pending.map(p => <article key={p.id} className="border rounded-xl p-4"><p className="font-bold">{p.name}</p><Link className="underline" to={'/product/' + p.id + '#reviews'}>Write Review</Link></article>) : <p>No products awaiting review. Products from confirmed purchases appear here.</p>}
  </section>;
}
