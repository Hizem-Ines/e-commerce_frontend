import api from './api';

export const createOrder      = (data)  => api.post('/orders', data);
export const createGuestOrder = (data)  => api.post('/orders/guest', data);
export const getMyOrders      = ()      => api.get('/orders/my');
export const getSingleOrder   = (id)    => api.get(`/orders/${id}`);
export const cancelOrder      = (id)    => api.patch(`/orders/${id}/cancel`);
export const confirmStripe    = (id)    => api.post(`/orders/${id}/stripe/confirm`);