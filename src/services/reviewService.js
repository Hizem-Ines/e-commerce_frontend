import api from './api';

// ── Public ───────────────────────────────────────────────────
export const getProductReviews = (productId) =>
  api.get(`/reviews/product/${productId}`);

// ── User connecté ────────────────────────────────────────────
// body : { rating, comment } — le back vérifie l'achat et le doublon lui-même
export const createReview = (productId, data) =>
  api.post('/reviews', { product_id: productId, ...data });

export const updateReview = (reviewId, data) =>
  api.put(`/reviews/${reviewId}`, data);

export const deleteReview = (reviewId) =>
  api.delete(`/reviews/${reviewId}`);

// ── Admin ────────────────────────────────────────────────────
// GET /api/reviews?rating=&date_from=&date_to=&page=
export const getAllReviews = (params = {}) =>
  api.get('/reviews', { params });