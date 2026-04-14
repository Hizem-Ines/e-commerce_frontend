import api from './api';

export const getSupplierBySlug = (slug) => api.get(`/suppliers/${slug}`);
export const getAllSuppliers = () => api.get('/suppliers');