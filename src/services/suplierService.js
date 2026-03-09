import api from './api';

export const getSupplierBySlug = (slug) => api.get(`/suppliers/${slug}`);