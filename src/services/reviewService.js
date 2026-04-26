import api from './api';

export const createReview = (productId, orderId, data) =>
  api.post('/reviews', { product_id: productId, order_id: orderId, ...data });

export const getProductReviews = (productId) =>
  api.get(`/reviews/product/${productId}`);

export const updateReview = (reviewId, data) => api.put(`/reviews/${reviewId}`, data);
export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`);

export const getReviewableProducts = () => api.get('/reviews/reviewable');