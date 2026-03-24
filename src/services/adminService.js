import api from './api';

export const getStats        = ()          => api.get('/stats');
export const getAllUsers      = ()          => api.get('/auth/users');
export const getAllOrders     = (params)    => api.get('/orders', { params });
export const updateOrderStatus = (id, data) => api.patch(`/orders/${id}/status`, data);
export const getAllProducts   = (params)    => api.get('/products', { params });
export const deleteProduct    = (id)        => api.delete(`/products/${id}`);
export const getAllSuppliers  = ()          => api.get('/suppliers');
export const deleteSupplier   = (id)        => api.delete(`/suppliers/${id}`);
export const getAllCategories = ()          => api.get('/categories');
export const getAllPromotions = ()          => api.get('/promotions');