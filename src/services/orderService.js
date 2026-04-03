import api from './api';

export const createOrder      = (data)  => api.post('/orders', data);
export const createGuestOrder = (data)  => api.post('/orders/guest', data);
export const getMyOrders      = ()      => api.get('/orders/my');
export const getSingleOrder   = (id)    => api.get(`/orders/${id}`);
export const cancelOrder      = (id)    => api.patch(`/orders/${id}/cancel`);
export const confirmStripe    = (id)    => api.post(`/orders/${id}/stripe/confirm`);
export const getAllOrders        = (params) => api.get('/orders', { params });
export const updateOrderStatus   = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const updateDelivery      = (id, data)   => api.patch(`/orders/${id}/delivery`, data);
export const getLowStockProducts = ()           => api.get('/orders/admin/low-stock');
export const adminUpdateShipping = (id, data)   => api.put(`/orders/${id}/shipping`, data);