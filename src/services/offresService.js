import api from './api';

export const getOffresData    = ()       => api.get('/offres');
export const validatePromoCode = (code)  => api.post('/offres/validate-promo', { code });