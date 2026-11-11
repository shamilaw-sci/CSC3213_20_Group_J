import { apiClient } from '../../../lib/axios';

export const syncCartWithBackend = async (cartItems, token) => {
  const payload = {
    items: cartItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }))
  };
  const response = await apiClient.post('/cart/sync', payload, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
  return response.data;
};

export const fetchCart = async (token) => {
  const response = await apiClient.get('/cart', { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};
