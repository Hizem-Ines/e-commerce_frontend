import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true, // ✅ CRUCIAL — envoie le cookie JWT avec chaque requête
});

export default api;