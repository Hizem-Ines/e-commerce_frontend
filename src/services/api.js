import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    withCredentials: true, // envoie le cookie JWT avec chaque requête
    timeout: 10000, // Si le backend ne répond pas, la requête reste en attente 10 secondes max
});

// Intercepteur sur les réponses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Token expiré → redirige vers login
    if (status === 401) {
      // Évite une boucle infinie si on est déjà sur /auth
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth';
      }
    }

    // authentifié mais pas autorisé (ex: un client qui accède à une route admin
    if (status === 403) {
      window.location.href = '/';
    }

    // Erreur serveur → log discret
    if (status >= 500) {
      console.error('[API] Erreur serveur :', error.response?.data?.message || error.message);
    }

    return Promise.reject(error);
  }
);

export default api;