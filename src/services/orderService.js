import api from './api';

export const createOrder         = (data)       => api.post('/orders', data);
export const createGuestOrder    = (data)       => api.post('/orders/guest', data);
export const getMyOrders         = ()           => api.get('/orders/my');
export const getSingleOrder      = (id)         => api.get(`/orders/${id}`);
export const cancelOrder         = (id, reason) => api.patch(`/orders/${id}/cancel`, { reason });
export const validatePromo       = (data)       => api.post('/orders/validate-promo', data);
export const getShippingCost     = (subtotal)   => api.get('/orders/shipping-cost', { params: { subtotal } });

export const getAllOrders         = (params)     => api.get('/orders/all', { params });
export const updateOrderStatus   = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const updateDelivery      = (id, data)   => api.patch(`/orders/${id}/delivery`, data);
export const getLowStockProducts = ()           => api.get('/orders/admin/low-stock');
export const adminUpdateShipping = (id, data)   => api.put(`/orders/${id}/shipping`, data);