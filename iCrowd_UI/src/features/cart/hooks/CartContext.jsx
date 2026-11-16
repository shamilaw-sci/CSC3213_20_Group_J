import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCartPromo } from './useCartPromo';
import { syncCartWithBackend, fetchCart } from '../api/cartApi';

import { CartContext } from './cartState';

function readCart(key) {
  try {
    const items = JSON.parse(sessionStorage.getItem(key) || '[]');
    return Array.isArray(items) ? items.filter(item => item?.product?.id && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch { return []; }
}

// Remount all cart state on account changes, including pending request guards.
export const CartProvider = ({ children }) => {
  const { user, initializing, credential } = useAuth();
  const owner = initializing ? 'initializing' : user ? String(user.id || user.email) : 'guest';
  return <AccountCartProvider key={`${owner}:${credential || ""}`} owner={owner} authenticated={!!user} initializing={initializing} token={credential}>{children}</AccountCartProvider>;
};

function AccountCartProvider({ children, owner, authenticated, initializing, token }) {
  const storageKey = authenticated ? `iCrowd_cart:${owner}` : 'iCrowd_guest_cart';
  const [cart, setCart] = useState(() => readCart(storageKey));
  const cartRef = useRef(cart);
  const [cartLoading, setCartLoading] = useState(authenticated || initializing);
  const [cartReady, setCartReady] = useState(!authenticated && !initializing);
  const promotion = useCartPromo(owner, cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), authenticated && cartReady);
  const [syncError, setSyncError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const queue = useRef(Promise.resolve());
  const active = useRef(false);
  const revision = useRef(0);

  const persist = (items) => {
    cartRef.current = items;
    setCart(items);
    try { sessionStorage.setItem(storageKey, JSON.stringify(items)); }
    catch { setSyncError('Your cart could not be saved in this browser.'); }
  };

  const load = async (isCurrent = () => active.current) => {
    setCartLoading(true);
    try {
      const result = await fetchCart(token);
      if (!isCurrent()) return;
      const saved = readCart(storageKey);
      const guest = readCart('iCrowd_guest_cart');
      const hasSaved = sessionStorage.getItem(storageKey) !== null;
      const items = hasSaved ? saved : (result.items || []).map(item => ({ product: item.product, quantity: item.quantity }));
      for (const item of guest) {
        if (!items.some(existing => existing.product.id === item.product.id)) items.push(item);
      }
      persist(items);
      if (hasSaved || guest.length) await syncCartWithBackend(items, token);
      if (!isCurrent()) return;
      sessionStorage.removeItem('iCrowd_guest_cart');
      sessionStorage.removeItem(storageKey);
      setSyncError('');
      setCartReady(true);
      setCartLoading(false);
    } catch {
      if (isCurrent()) {
        setSyncError('Your cart could not be loaded or saved. Retry before checking out.');
        setCartLoading(false);
      }
    }
  };

  useEffect(() => {
    active.current = true;
    let current = true;
    if (authenticated) load(() => current);
    return () => { current = false; active.current = false; };
    // Each account has its own mounted provider and captured credentials.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = (items) => {
    if (!authenticated) return;
    const version = ++revision.current;
    setIsSyncing(true);
    queue.current = queue.current.catch(() => {}).then(async () => {
      try {
        if (!active.current || localStorage.getItem('token') !== token) return;
        await syncCartWithBackend(items, token);
        if (active.current && version === revision.current) {
          setSyncError('');
          sessionStorage.removeItem(storageKey);
        }
      } catch {
        if (active.current && version === revision.current) setSyncError('Your latest cart changes have not been saved. Please retry.');
      } finally {
        if (active.current && version === revision.current) setIsSyncing(false);
      }
    });
  };
  const change = (items) => {
    if (!cartReady) return;
    persist(items); sync(items);
  };
  const addToCart = (product) => {
    if (cartLoading || !(product.availableStock > 0)) return;
    const previous = cartRef.current;
    const existing = previous.find(item => item.product.id === product.id);
    change(existing ? previous.map(item => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.availableStock) } : item) : [...previous, { product, quantity: 1 }]);
  };
  const removeFromCart = productId => change(cartRef.current.filter(item => item.product.id !== productId));
  const updateQuantity = (productId, quantity) => {
    if (!Number.isInteger(quantity)) return;
    if (quantity <= 0) return removeFromCart(productId);
    change(cartRef.current.map(item => item.product.id === productId ? { ...item, quantity: Math.min(quantity, item.product.availableStock) } : item).filter(item => item.quantity > 0));
  };
  const completeCheckout = (orderId, items) => {
    if (!cartReady) return;
    const key = `completed-order:${owner}:${orderId}`;
    if (sessionStorage.getItem(key)) return;
    const next = cartRef.current.map(item => ({ ...item, quantity: Math.max(0, item.quantity - items.filter(x => x.productId === item.product.id).reduce((sum, x) => sum + x.quantity, 0)) })).filter(item => item.quantity > 0);
    change(next);
    sessionStorage.setItem(key, 'true');
    promotion.removePromo();
  };
  return <CartContext.Provider value={{
    ...promotion, cart, cartLoading, cartReady, syncError, isSyncing,
    retrySync: () => sync(cartRef.current),
    retryLoad: () => load(),
    addToCart, removeFromCart, updateQuantity, completeCheckout,
    clearCart: () => change([]),
    getCartTotal: () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    getItemCount: () => cart.reduce((sum, item) => sum + item.quantity, 0),
    isProductInCart: id => cart.some(item => item.product.id === id),
  }}>{children}</CartContext.Provider>;
}
