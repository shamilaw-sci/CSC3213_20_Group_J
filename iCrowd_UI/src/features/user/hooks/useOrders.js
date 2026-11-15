import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';
export const orderLabel = order => ({ CHARGEBACK: 'Payment disputed', REVIEW_REQUIRED: 'Payment under review', REFUND_PENDING: 'Refund in progress', REFUNDED: 'Refunded' }[order.paymentStatus]) || (order.status === 'STOCK_UNAVAILABLE' ? 'Refund in progress' : ({ PENDING_PAYMENT: 'Awaiting payment', CONFIRMED: 'Order confirmed', PROCESSING: 'Preparing your order', SHIPPED: 'Dispatched / In Transit', DELIVERED: 'Delivered', COMPLETED: 'Completed', FAILED: 'Payment unsuccessful', CANCELLED: 'Cancelled' }[order.status] || 'Order received'));
export function useOrders() {
  const [orders,setOrders]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState('');
  const [page,setPage]=useState(0), [last,setLast]=useState(true), [attempt,setAttempt]=useState(0);
  useEffect(() => {
    const controller=new AbortController();
    apiClient.get('/orders',{ params:{page,size:20},signal:controller.signal }).then(({data}) => {
      const incoming=Array.isArray(data) ? data : data.content || [];
      setOrders(previous => page===0 ? incoming : [...previous.filter(p => !incoming.some(i => i.id===p.id)),...incoming]);
      setLast(Array.isArray(data) || data.last); setError('');
    }).catch(e => { if(!controller.signal.aborted) setError(e.response?.data?.message || 'We could not load your orders. Please try again.'); })
      .finally(() => { if(!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  },[page,attempt]);
  return { orders,loading,error,hasMore:!last,loadMore:() => { setLoading(true);setPage(p => p+1); },retry:() => { setLoading(true);setAttempt(a => a+1); } };
}
