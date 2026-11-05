import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/axios';
import { useAuth } from '../../auth/context/AuthContext';

export default function QuestionSection({ productId }) {
  const { user, isAdmin } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerId, setAnswerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const page = useRef(0);
  const busy = useRef(false);
  const generation = useRef(0);
  const url = '/products/' + productId + '/questions';
  const load = useCallback(async (next = 0) => {
    if (busy.current) return;
    const current = generation.current;
    busy.current = true; setLoading(true); setError('');
    try {
      const { data } = await apiClient.get(url, { params: { page: next, size: 10 } });
      if (current !== generation.current) return;
      setQuestions(prev => next === 0 ? data.content : [...prev, ...data.content.filter(q => !prev.some(p => p.id === q.id))]);
      page.current = next; setHasMore(!data.last);
    } catch (err) { if (current === generation.current) setError(err.response?.data?.message || 'Unable to load questions.'); }
    finally { if (current === generation.current) { busy.current = false; setLoading(false); } }
  }, [url]);
  useEffect(() => { generation.current++; const effectGeneration = generation.current; busy.current = false; load(); return () => { generation.current = effectGeneration + 1; busy.current = false; }; }, [load]);
  const mutate = async (action, success) => {
    setSaving(true); setMessage('');
    try { await action(); setText(''); setAnswerId(null); setAnswer(''); setMessage(success); await load(); }
    catch (err) { setMessage(err.response?.data?.message || 'Unable to save. Please retry.'); }
    finally { setSaving(false); }
  };
  return <section className="mb-12 bg-[#F6F6F6] p-6 md:p-10 rounded-[32px]">
    <h2 className="text-2xl font-bold mb-3">Questions & Answers</h2>
    <p className="text-gray-600 mb-4">Ask about this product. Store staff will respond here.</p>
    {user ? <form className="mb-6 space-y-3" onSubmit={e => { e.preventDefault(); mutate(() => apiClient.post(url, { text: text.trim() }), 'Question posted.'); }}>
      <label className="block">Your question<textarea aria-label="Your question" required minLength={5} maxLength={1000} value={text} onChange={e => setText(e.target.value)} className="w-full block border rounded-xl p-3 bg-white mt-1" /></label>
      <button disabled={saving || loading || text.trim().length < 5} className="bg-black text-white rounded-full px-5 py-2 disabled:opacity-50">Ask question</button>
    </form> : <Link to="/login" className="underline">Sign in to ask a question</Link>}
    {message && <p role="status" className="my-3">{message}</p>}
    {error && <p role="alert" className="text-red-700 my-3">{error} <button className="underline" onClick={() => load(page.current)}>Retry</button></p>}
    {!loading && !error && questions.length === 0 && <p className="py-4">No questions yet. Ask the first question about this product.</p>}
    <div className="space-y-4">{questions.map(q => <article key={q.id} className="bg-white rounded-xl p-5">
      <p className="font-semibold whitespace-pre-wrap break-words">{q.question}</p>
      <p className="text-sm text-gray-500 mt-1">Asked by {q.authorName} · {new Date(q.createdAt).toLocaleDateString()}</p>
      {q.answer ? <div className="mt-4 border-l-4 border-gray-300 pl-4"><p className="font-semibold">Store staff</p><p className="whitespace-pre-wrap break-words">{q.answer}</p></div> : <p className="text-gray-500 mt-3">Awaiting a staff answer.</p>}
      {isAdmin && <button disabled={saving || loading} className="underline mt-3 mr-4" onClick={() => { setAnswerId(q.id); setAnswer(q.answer || ''); }}>{q.answer ? 'Edit answer' : 'Answer question'}</button>}
      {user && (isAdmin || String(user.id) === String(q.userId)) && <button disabled={saving || loading} className="text-red-700 underline mt-3" onClick={() => { if (window.confirm('Delete this question and its answer?')) mutate(() => apiClient.delete(url + '/' + q.id), 'Question deleted.'); }}>Delete question</button>}
      {isAdmin && answerId === q.id && <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); mutate(() => apiClient.put(url + '/' + q.id + '/answer', { text: answer.trim() }), 'Answer saved.'); }}>
        <label className="block">Staff answer<textarea aria-label="Staff answer" required minLength={5} maxLength={2000} value={answer} onChange={e => setAnswer(e.target.value)} className="block w-full border rounded p-3" /></label>
        <button disabled={saving || answer.trim().length < 5} className="bg-black text-white px-4 py-2 rounded">Save answer</button><button type="button" className="ml-4" onClick={() => setAnswerId(null)}>Cancel</button>
      </form>}
    </article>)}</div>
    {loading && <p role="status" className="py-4">Loading questions...</p>}
    {hasMore && <button disabled={loading || saving} className="underline mt-4" onClick={() => load(page.current + 1)}>Load More Questions</button>}
  </section>;
}
