import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';

export const orderLabel = order => order.status === 'STOCK_UNAVAILABLE'
  ? order.paymentStatus === 'REFUNDED' ? 'Refunded' : 'Refund in progress'
  : ({ PENDING_PAYMENT: 'Awaiting payment', CONFIRMED: 'Order confirmed', PROCESSING: 'Preparing your order', COMPLETED: 'Delivered', FAILED: 'Payment unsuccessful', CANCELLED: 'Cancelled' }[order.status] || 'Order received');

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    apiClient.get('/orders').then(({ data }) => { if (current) { setOrders(data); setError(''); } }).catch(() => { if (current) setError('We could not load your orders. Please try again.'); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [attempt]);
  return { orders, loading, error, retry: () => { setLoading(true); setAttempt(value => value + 1); } };
}
