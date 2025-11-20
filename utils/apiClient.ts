
import axios from 'axios';

// In production, this would be your deployed backend URL
// You can use import.meta.env.VITE_API_URL if using Vite env vars
const BASE_URL = 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // Increased timeout for production latency
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('masuma_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Auth Errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Session Expiry
    if (error.response && error.response.status === 401) {
      // Only clear if it's definitely an invalid token, not a login attempt
      if (!error.config.url.includes('/login')) {
          localStorage.removeItem('masuma_auth_token');
          window.location.href = '/'; // Redirect to home/login
      }
    }
    return Promise.reject(error);
  }
);

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
