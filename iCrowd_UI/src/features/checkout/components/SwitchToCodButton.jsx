import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../cart/hooks/CartContext';
import { switchOrderToCod } from '../api/checkoutApi';

export default function SwitchToCodButton({ orderId, disabled = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { removeFromCart } = useCart();
  const navigate = useNavigate();
  const switchMethod = async () => {
    setBusy(true);
    setError('');
    try {
      await switchOrderToCod(orderId);
      // Reload the verified order state even when already on the success route.
      window.location.assign(`/checkout/success?orderId=${encodeURIComponent(orderId)}`);
    } catch (err) {
      const result = err.response?.data;
      if (result?.error === 'OUT_OF_STOCK') {
        removeFromCart(result.productId);
        localStorage.removeItem('checkoutData');
        navigate('/cart', { state: { checkoutMessage: `Sorry, ${result.productName || 'an item'} just sold out. We removed it from your cart.` } });
      } else {
        setError(result?.message || 'Could not change payment method. Please check your order status.');
      }
      setBusy(false);
    }
  };
  return <div>
    <button type="button" onClick={switchMethod} disabled={busy || disabled}
      className="bg-gray-100 text-black px-6 py-3.5 rounded-full font-bold text-sm disabled:opacity-50 cursor-pointer">
      {busy ? 'Confirming COD…' : 'Pay Cash on Delivery'}
    </button>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
}
