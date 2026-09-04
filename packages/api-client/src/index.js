import axios from 'axios';
import useAuthStore from '@sms/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000, // 15-second request timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auth errors & standardize network/timeout failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, trigger logout
      console.warn('Unauthorized request. Logging out user...');
      useAuthStore.getState().logout();
    } else if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      error.isTimeout = true;
      error.userMessage = 'The request timed out after 15 seconds. Please try again.';
    } else if (!error.response) {
      error.isNetworkError = true;
      error.userMessage = 'Network connection failed. Please verify your internet connection.';
    } else if (error.response?.data?.message) {
      error.userMessage = error.response.data.message;
    }

    return Promise.reject(error);
  }
);

export default api;
