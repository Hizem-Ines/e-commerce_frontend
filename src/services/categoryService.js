import api from './api';

export const getAllCategories = () => api.get('/categories');
export const getCategoryById = (id) => api.get(`/categories/${id}`);