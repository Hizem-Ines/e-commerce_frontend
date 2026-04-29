import axios from 'axios';

const api = axios.create({
    baseURL: `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api`,
    withCredentials: true, // envoie le cookie JWT avec chaque requête
    timeout: 10000, // Si le backend ne répond pas, la requête reste en attente 10 secondes max
});

// Intercepteur sur les réponses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      const publicPaths = [
        '/connexion',
        '/reset-password',
        '/verify-email',
        '/mot-de-passe-oublie',
        '/complete-account',
        '/login/success',
        '/',
      ];
      const isPublic = publicPaths.some(path => window.location.pathname.startsWith(path));
      if (!isPublic) {
        window.location.href = '/connexion';
      }
    }

    if (status >= 500) {
      console.error('[API] Erreur serveur :', error.response?.data?.message || error.message);
    }

    return Promise.reject(error);
  }
);

export default api;