import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../cart/hooks/cartState';
import { formatLkr } from '../../../lib/currency';

export default function ProductCard({ product }) {
  const { addToCart, isProductInCart, cartLoading, cartReady } = useCart();
  const unavailable = !(product.availableStock > 0);
  const inCart = isProductInCart(product.id);
  return <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
    <Link to={`/product/${product.id}`} className="block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600">
      <div className="aspect-[5/4] overflow-hidden bg-slate-50">
        <img src={product.imageUrls?.[0] || '/images/product-placeholder.svg'} alt={product.name} loading="lazy" onError={event => { event.currentTarget.src = '/images/product-placeholder.svg'; }} className="h-full w-full object-cover transition-transform group-hover:scale-105"/>
      </div>
      <div className="px-5 pt-5"><h3 className="min-h-12 text-base font-bold leading-6 text-slate-950 line-clamp-2">{product.name}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-slate-600 line-clamp-2">{product.description || product.category?.name || 'Explore product details'}</p></div>
    </Link>
    <div className="mt-auto space-y-3 p-5 pt-4">
      <p className="break-words text-xl font-bold tracking-tight text-slate-950">{formatLkr(product.price)}</p>
      {inCart ? <Link to="/cart" className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-800"><ShoppingBag size={17}/>View in cart</Link> : <button onClick={() => addToCart(product)} disabled={unavailable || cartLoading || !cartReady} className="w-full rounded-xl bg-slate-950 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">{unavailable ? 'Sold out' : 'Add to cart'}</button>}
    </div>
  </article>;
}
