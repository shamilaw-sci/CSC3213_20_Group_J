import { apiClient } from '../../../lib/axios';

export const createCheckoutOrder = async (orderPayload) => {
  const response = await apiClient.post('/orders/checkout', orderPayload);
  return response.data;
};

export const uploadBankReceipt = async (orderId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post(`/orders/${orderId}/receipt`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const validatePromoCode = async (code, cartSubTotal) => {
  const response = await apiClient.post('/promo/validate', { code, cartSubTotal });
  return response.data;
};
