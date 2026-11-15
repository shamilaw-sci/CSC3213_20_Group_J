import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useOrders, orderLabel } from '../hooks/useOrders';
import { formatLkr } from '../../../lib/currency';

export default function OrdersView({ filterType = 'all' }) {
  const [tab, setTab] = useState(['returns', 'cancellations'].includes(filterType) ? filterType : 'all');
  const { orders, loading, error, retry, hasMore, loadMore } = useOrders();
  const filtered = orders.filter(order => tab === 'all' || (tab === 'current' && ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'FAILED'].includes(order.status)) || (tab === 'delivered' && ['COMPLETED','DELIVERED'].includes(order.status)) || (tab === 'returns' && ['REFUNDED', 'REFUND_PENDING'].includes(order.paymentStatus)) || (tab === 'cancellations' && order.status === 'CANCELLED'));
  return <section className="space-y-5">
    <div className="flex flex-wrap gap-2" aria-label="Filter orders">{[['all', 'All orders'], ['current', 'In progress'], ['delivered', 'Delivered'], ['returns', 'Refunds'], ['cancellations', 'Cancelled']].map(([value, label]) => <button key={value} onClick={() => setTab(value)} aria-pressed={tab === value} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === value ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{label}</button>)}</div>
    {loading ? <p role="status" className="p-6">Loading your orders…</p> : error ? <div role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">{error} <button onClick={retry} className="underline">Retry</button></div> : filtered.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><Package className="mx-auto mb-4 text-slate-400" size={36}/><h2 className="text-lg font-bold">No orders here yet</h2><p className="mt-2 text-sm text-slate-600">Your purchases will appear here with their latest status.</p><Link to="/search" className="mt-5 inline-block rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">Browse products</Link></div> : filtered.map(order => <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5"><div><h2 className="font-bold">{order.reference || `Order #${order.id}`}</h2><p className="mt-1 text-sm text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p></div><span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">{orderLabel(order)}</span></header>
      <div className="space-y-5 p-5 sm:p-6"><ul className="space-y-3">{order.items.map(item => <li key={item.productId} className="flex justify-between gap-4 text-sm"><div className="min-w-0"><Link to={`/product/${item.productId}`} className="font-semibold hover:underline">{item.name}</Link><p className="mt-1 text-slate-500">Quantity {item.quantity}</p></div><span className="shrink-0 font-semibold">{formatLkr(item.price * item.quantity)}</span></li>)}</ul>
      <div className="grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2"><div><p className="font-semibold">Delivery address</p><p className="mt-1 break-words leading-6 text-slate-600">{[order.address, order.district].filter(Boolean).join(', ') || 'Not available'}</p></div><div><p className="font-semibold">Payment</p><p className="mt-1 text-slate-600">{order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Card payment'}</p></div></div>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-500">Order total</p><strong className="text-xl">{formatLkr(order.total)}</strong></div><Link to={`/checkout/success?orderId=${order.id}`} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">{order.status === 'STOCK_UNAVAILABLE' ? 'View refund status' : 'View order status'}</Link></footer>
      </div>
    </article>)}
    {hasMore && !loading && <button onClick={loadMore} className="border rounded-xl px-6 py-3">Load more orders</button>}
  </section>;
}
