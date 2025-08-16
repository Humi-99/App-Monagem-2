import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Check if we're in demo mode (frontend-only deployment)
const isDemoMode = !BACKEND_URL || BACKEND_URL.includes('vercel.app') || process.env.NODE_ENV === 'production';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  timeout: isDemoMode ? 3000 : 10000, // Shorter timeout in demo mode
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('moangem_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // In demo mode, don't try to reload on auth errors
    if (error.response?.status === 401 && !isDemoMode) {
      // Clear invalid token
      localStorage.removeItem('moangem_token');
      localStorage.removeItem('moangem_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;