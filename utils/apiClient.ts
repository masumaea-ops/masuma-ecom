
import axios from 'axios';

// In production, this would be your deployed backend URL. 
// In development, we use the relative path '/api' to leverage the Vite proxy defined in vite.config.ts.
const getBaseUrl = () => {
  // Cast import.meta to any to avoid TypeScript errors if Vite types aren't loaded globally
  try {
      const metaEnv = (import.meta as any).env;
      if (metaEnv && metaEnv.VITE_API_URL) {
        return metaEnv.VITE_API_URL;
      }
  } catch (e) {
      // Ignore
  }
  return '/api';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json', // RESTORED: Required for backend to parse JSON bodies
  }
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('masuma_auth_token');
    if (token) {
      config.headers = config.headers || {}; // Ensure headers object exists
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle Auth Error (401)
    if (error.response?.status === 401) {
        const isLoginRequest = error.config.url.includes('/login');
        const isHealthCheck = error.config.url.includes('/health');
        
        if (!isLoginRequest && !isHealthCheck) {
            localStorage.removeItem('masuma_auth_token');
            if (window.location.pathname !== '/' && !window.location.pathname.includes('login')) {
                 window.location.href = '/';
            }
        }
    }
    return Promise.reject(error);
  }
);

export const formatCurrency = (amount: number) => {
  const val = Number(amount);
  if (isNaN(val)) return 'KES 0';
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};
