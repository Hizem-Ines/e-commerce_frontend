import api from './api';

// Génère ou récupère un session_id — toujours disponible
let _sessionId = null;

export const getSessionId = () => {
    if (_sessionId) return _sessionId;
    
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('session_id', sessionId);
        console.log('✅ Session ID créé:', sessionId);
    }
    _sessionId = sessionId;
    return sessionId;
};

// ✅ Toujours envoyer x-session-id dans tous les appels
// Le backend utilise le cookie JWT en priorité si l'user est connecté
const headers = () => ({
    headers: { 'x-session-id': getSessionId() }
});

export const getCart        = ()           => api.get('/cart', headers());
export const addToCart      = (data)       => api.post('/cart', data, headers());
export const updateCartItem = (id, data)   => api.put(`/cart/${id}`, data, headers());
export const removeFromCart = (id)         => api.delete(`/cart/${id}`, headers());
export const clearCart      = ()           => api.delete('/cart', headers());
export const mergeCart      = (session_id) => api.post('/cart/merge', { session_id });