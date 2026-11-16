import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';
import { formatLkr } from '../../../lib/currency';

export default function AdminPayments() {
  const [data,setData]=useState(null), [error,setError]=useState(''), [page,setPage]=useState(0), [attempt,setAttempt]=useState(0);
  const [selected,setSelected]=useState(null), [password,setPassword]=useState(''), [note,setNote]=useState(''), [outcome,setOutcome]=useState('FAILED'), [saving,setSaving]=useState(false);
  useEffect(() => {
    const controller=new AbortController();
    apiClient.get('/admin/payments/review',{params:{page},signal:controller.signal}).then(r => {setData(r.data);setError('');})
      .catch(e => {if(!controller.signal.aborted) setError(e.response?.data?.message || 'Payment reviews could not be loaded.');});
    return () => controller.abort();
  },[page,attempt]);
  const resolve=async event => {
    event.preventDefault();setSaving(true);setError('');
    try {await apiClient.post(`/admin/payments/${selected.id}/resolve`,{password,note,outcome});setSelected(null);setPassword('');setNote('');setAttempt(a => a+1);}
    catch(e) {setError(e.response?.data?.message || 'The verification could not be recorded.');}
    finally {setSaving(false);}
  };
  return <section className="p-6 space-y-5"><h1 className="text-2xl font-bold">Payment reviews</h1>
    <p>Check the payment in your merchant dashboard before recording a result. A missing notification does not confirm that a payment failed.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!data ? <p role="status">Loading payment reviews…</p> : data.content.length===0 ? <p>No payments need review.</p> : data.content.map(payment => <article key={payment.id} className="rounded-xl border p-4 flex items-center justify-between gap-4"><div><strong>{payment.reference || `Order ${payment.orderId}`}</strong><p>{formatLkr(payment.amount)} · {payment.status.replaceAll('_',' ')}</p></div>{payment.status==='CHARGEBACK' ? <p>Dispute requires action in the merchant dashboard.</p> : <button className="border rounded-lg p-2" onClick={() => {setSelected(payment);setPassword('');setNote('');setOutcome(payment.status==='REFUND_PENDING'?'REFUNDED':'FAILED');}}>Record verification</button>}</article>)}
    <div className="flex gap-4"><button disabled={page===0} onClick={() => setPage(p => p-1)}>Previous</button><button disabled={!data || data.last} onClick={() => setPage(p => p+1)}>Next</button></div>
    {selected && <form onSubmit={resolve} className="rounded-xl border bg-white p-5 space-y-4"><h2 className="font-bold">Merchant verification for {selected.reference}</h2><label className="block">Verified result<select className="block border p-2" value={outcome} onChange={e => setOutcome(e.target.value)}><option value="FAILED">Confirmed unsuccessful payment</option><option value="REFUNDED">Confirmed completed refund</option></select></label><label className="block">Merchant reference and verification notes<textarea required minLength={10} maxLength={1000} className="block w-full border p-2" value={note} onChange={e => setNote(e.target.value)}/></label><label className="block">Your administrator password<input required autoComplete="current-password" type="password" className="block border p-2" value={password} onChange={e => setPassword(e.target.value)}/></label><button disabled={saving} className="rounded-lg bg-black text-white px-4 py-2">{saving?'Saving…':'Record verified result'}</button><button type="button" className="ml-4" onClick={() => {setSelected(null);setPassword('');}}>Cancel</button></form>}
  </section>;
}
