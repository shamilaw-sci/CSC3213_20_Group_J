import { apiClient } from '../../../lib/axios';

export const syncCartWithBackend = async (cartItems) => {
  const payload = {
    items: cartItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }))
  };
  const response = await apiClient.post('/cart/sync', payload);
  return response.data;
};
