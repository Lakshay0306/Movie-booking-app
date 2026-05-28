// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: (typeof window !== 'undefined' ? (window.location.origin + '/api') : 'http://localhost:5000/api'),
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    // Read auth storage directly from localStorage
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      }
    } catch (error) {
      // Ignored
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
      originalRequest._retry = true;
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          if (state?.refreshToken) {
            const res = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
              refreshToken: state.refreshToken
            });
            if (res.data?.accessToken) {
              state.accessToken = res.data.accessToken;
              if (res.data.refreshToken) state.refreshToken = res.data.refreshToken;
              localStorage.setItem('auth-storage', JSON.stringify({ state }));
              originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
              return api(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        // Logout user on failure
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
