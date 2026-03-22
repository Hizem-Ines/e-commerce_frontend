import api from './api';

export const createReview = (productId, data) => api.post(`/reviews/${productId}`, data);
export const getProductReviews = (productId) => api.get(`/reviews/${productId}`);
export const updateReview = (reviewId, data) => api.put(`/reviews/${reviewId}`, data);
export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`);