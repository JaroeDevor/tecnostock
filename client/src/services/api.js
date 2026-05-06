import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Interceptor para agregar el token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tecnostock_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para detectar tokens expirados
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el token expira o es inválido, limpiamos localStorage
      // Idealmente, también haríamos un dispatch para desloguear el Context,
      // pero por ahora forzamos un reload si estamos en una ruta protegida.
      if (window.location.pathname !== '/') {
        localStorage.removeItem('tecnostock_token');
        localStorage.removeItem('tecnostock_user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
