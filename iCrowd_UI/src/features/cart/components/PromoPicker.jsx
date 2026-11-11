import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, X } from 'lucide-react';
import { apiClient } from '../../../lib/axios';
import { formatLkr } from '../../../lib/currency';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCart } from '../hooks/CartContext';

function PromoDialog({ total, onClose }) {
  const { isAuthenticated } = useAuth();
  const { promo, promoBusy, promoError, applyPromo } = useCart();
  const [code, setCode] = useState('');
  const [offers, setOffers] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element.open) element.showModal();
  }, []);
  useEffect(() => {
    if (!isAuthenticated) return;
    let current = true;
    apiClient.get('/promo/available', { params: { cartSubTotal: total } }).then(({ data }) => {
      if (current) { setOffers(data); setError(''); }
    }).catch(() => { if (current) setError('We could not load your offers. Try again or enter a code.'); });
    return () => { current = false; };
  }, [isAuthenticated, total, attempt]);
  return <dialog ref={dialog} onClose={onClose} className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-950/60">
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold">Promotions for you</h2><button aria-label="Close promotions" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X size={20}/></button></div>
      {!isAuthenticated ? <p className="mt-6 text-slate-600"><Link to="/login" className="font-semibold underline">Sign in</Link> to see and apply your available offers.</p> : <>
        <p className="mt-2 text-sm text-slate-600">Choose an offer for this cart, or enter your own code.</p>
        <form onSubmit={event => { event.preventDefault(); if (!promoBusy && code.trim()) applyPromo(code); }} className="my-5">
          <label htmlFor="cart-promo-code" className="mb-2 block text-sm font-semibold">Promo code</label>
          <div className="flex gap-2"><input id="cart-promo-code" autoComplete="off" maxLength={60} disabled={promoBusy} value={code} onChange={event => setCode(event.target.value.toUpperCase())} className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3" placeholder="Enter code"/><button disabled={promoBusy || !code.trim()} className="rounded-xl bg-slate-900 px-4 text-white disabled:opacity-50">Apply</button></div>
        </form>
        {promoBusy && <p role="status" className="mb-4 text-sm">Checking your code…</p>}
        {promoError && <p role="alert" className="mb-4 text-sm text-red-700">{promoError}</p>}
        {promo && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{promo.promoCode} applied. You save {formatLkr(promo.discountAmount)}.</p>}
        {error ? <p role="alert" className="text-sm text-red-700">{error} <button onClick={() => setAttempt(value => value + 1)} className="underline">Retry</button></p> : offers === null ? <p role="status">Finding your offers…</p> : <div className="max-h-64 space-y-3 overflow-y-auto">
          {offers.length === 0 && <p className="text-sm text-slate-500">No offers are available for this cart right now.</p>}
          {offers.map(offer => <button key={offer.promoCode} disabled={promoBusy} onClick={() => { setCode(offer.promoCode); applyPromo(offer.promoCode); }} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 text-left hover:border-slate-900 disabled:opacity-50"><span><strong className="block">{offer.promoCode}</strong><span className="text-sm text-emerald-700">Save {formatLkr(offer.discountAmount)}</span></span><span className="text-sm font-semibold">Select</span></button>)}
        </div>}
      </>}
      <button onClick={onClose} className="mt-6 w-full rounded-xl bg-slate-100 py-3 font-semibold">Done</button>
    </div>
  </dialog>;
}

export default function PromoPicker({ total }) {
  const [open, setOpen] = useState(false);
  const { promo, promoBusy, promoError, removePromo } = useCart();
  return <div className="border-y border-slate-200 py-4">
    <button onClick={() => setOpen(true)} className="flex w-full items-center gap-2 text-sm font-semibold"><Tag size={18}/>{promo ? `Promo: ${promo.promoCode}` : 'Add promo code'}<span className="ml-auto">+</span></button>
    {promo && <div className="mt-2 flex items-center justify-between gap-2 text-sm text-emerald-700"><span>You save {formatLkr(promo.discountAmount)}</span><button onClick={removePromo} aria-label="Remove cart promo code" className="underline">Remove</button></div>}
    {promoBusy && <p role="status" className="mt-2 text-sm">Checking your promotion…</p>}
    {promoError && <p role="alert" className="mt-2 text-sm text-red-700">{promoError}</p>}
    {open && <PromoDialog total={total} onClose={() => setOpen(false)}/>}
  </div>;
}
