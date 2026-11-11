import { Link } from 'react-router-dom';
import { useOrders, orderLabel } from '../hooks/useOrders';
import { formatLkr } from '../../../lib/currency';

export default function RecentOrdersCard({ onViewAllOrders }) {
  const { orders, loading, error, retry } = useOrders();
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <header className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Recent orders</h2><button onClick={onViewAllOrders} className="text-sm font-semibold underline">View all</button></header>
    {loading ? <p role="status">Loading your orders…</p> : error ? <p role="alert">{error} <button onClick={retry} className="underline">Retry</button></p> : orders.length === 0 ? <p className="text-sm text-slate-500">You have not placed any orders yet.</p> : <ul className="divide-y divide-slate-100">{orders.slice(0, 3).map(order => <li key={order.id} className="flex flex-wrap justify-between gap-3 py-4"><div><Link to={`/checkout/success?orderId=${order.id}`} className="font-semibold hover:underline">{order.reference || `Order #${order.id}`}</Link><p className="mt-1 text-sm text-slate-500">{orderLabel(order)}</p></div><strong className="text-sm">{formatLkr(order.total)}</strong></li>)}</ul>}
  </section>;
}
