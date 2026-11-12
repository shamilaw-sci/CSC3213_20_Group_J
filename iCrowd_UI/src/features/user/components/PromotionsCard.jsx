import { Link } from 'react-router-dom';
import PromoPicker from '../../cart/components/PromoPicker';
import { useCart } from '../../cart/hooks/CartContext';

export default function PromotionsCard() {
  const { getCartTotal, cart } = useCart();
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Your promotions</h2><p className="my-3 text-sm leading-6 text-slate-600">Available offers depend on your account and the items in your cart.</p>{cart.length ? <PromoPicker total={getCartTotal()}/> : <p className="text-sm text-slate-500">Add products to your cart to see the offers you can use.</p>}<Link to={cart.length ? '/cart' : '/search'} className="mt-4 inline-block text-sm font-semibold underline">{cart.length ? 'Go to cart' : 'Browse products'}</Link></section>;
}
