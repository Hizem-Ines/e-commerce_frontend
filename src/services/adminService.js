import api from './api';

export const getStats = (params = {}) => api.get('/stats', { params });
export const exportStats = (params = {}) =>
  api.get('/stats/export', { params, responseType: 'blob' });
export const getAllUsers = (params = {}) => api.get('/auth/users', { params });
export const getAllOrders = (params) => api.get('/orders/all', { params });
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const getAllProducts     = (params)     => api.get('/products', { params: { ...params, admin: 'true' } });
export const deleteProduct     = (id)         => api.delete(`/products/${id}`);
export const getAllSuppliers    = ()           => api.get('/suppliers');
export const deleteSupplier    = (id)         => api.delete(`/suppliers/${id}`);
export const getAllCategories   = ()           => api.get('/categories');
export const getAllPromotions   = ()           => api.get('/promotions');
export const deleteUser       = (userId)        => api.delete(`/auth/users/${userId}`);
export const updateUserRole   = (userId, role)  => api.patch(`/auth/users/${userId}/role`, { role });
export const suspendUser      = (userId)        => api.patch(`/auth/users/${userId}/suspend`);
export const activateUser     = (userId)        => api.patch(`/auth/users/${userId}/activate`);
export const adminUpdateUser  = (userId, data)  => api.put(`/auth/users/${userId}`, data);
// Create a new product  (multipart/form-data)
export const createProduct = (formData) =>
    api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

// Update an existing product  (multipart/form-data)
export const updateProduct = (productId, formData) =>
    api.put(`/products/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });