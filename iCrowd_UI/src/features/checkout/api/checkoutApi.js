import { apiClient } from '../../../lib/axios';

export const switchOrderToCod = async (orderId) => {
  const response = await apiClient.post(`/orders/${orderId}/switch-to-cod`);
  return response.data;
};

/**
 * Validates shipping information and gets server-trusted pricing calculations
 * (subtotal, discounts, delivery fee, total).
 * Does not create an order or charge the customer.
 */
export const validateShippingDetails = async (shippingPayload) => {
  const response = await apiClient.post('/orders/validate-shipping', shippingPayload);
  return response.data;
};

/**
 * Phase 4: Create order on the backend.
 * Allocates COD inventory atomically, calculates trusted totals, and assigns order ID.
 */
export const createOrder = async (orderPayload) => {
  const response = await apiClient.post('/orders', orderPayload);
  return response.data;
};

/**
 * Phase 5: Initiate payment attempt with PayHere.
 * Returns the hosted checkout URL, signed form fields, and internal payment ID.
 */
export const initiatePayment = async (orderId, paymentMethod) => {
  const response = await apiClient.post('/payments/initiate', {
    orderId,
    paymentMethod,
  });
  return response.data;
};

/**
 * Phase 7: Retrieve live order and payment status from the backend.
 */
export const getPaymentStatus = async (orderId) => {
  const response = await apiClient.get(`/orders/${orderId}/payment-status`);
  return response.data;
};

/**
 * Legacy checkout endpoints for backward compatibility
 */
export const createCheckoutOrder = async (orderPayload) => {
  const response = await apiClient.post('/orders/checkout', orderPayload);
  return response.data;
};

export const uploadBankReceipt = async (orderId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post(`/orders/${orderId}/receipt`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Both initial checkout and retry must POST the signed fields to PayHere.
export const submitPayHereCheckout = (session) => {
  const allowedUrls = ['https://sandbox.payhere.lk/pay/checkout', 'https://www.payhere.lk/pay/checkout'];
  if (!allowedUrls.includes(session.checkoutUrl) || !session.checkoutFields) {
    throw new Error('Invalid payment gateway response');
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = session.checkoutUrl;
  for (const [name, value] of Object.entries(session.checkoutFields)) {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = name; input.value = String(value);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
};

export const validatePromoCode = async (code, cartSubTotal) => {
  const response = await apiClient.post('/promo/validate', { code, cartSubTotal });
  return response.data;
};

export const getAvailablePromoCodes = async () => {
  const response = await apiClient.get('/promo/available');
  return response.data;
};
