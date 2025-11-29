
import axios from 'axios';

// Robust base URL detection
const getBaseUrl = () => {
  try {
      // @ts-ignore - Vite specific
      const metaEnv = import.meta.env;
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
  // Removed hardcoded Content-Type to allow Axios to auto-detect (JSON vs FormData)
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('masuma_auth_token');
    if (token) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      (config.headers as any).Authorization = `Bearer ${token}`;
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
            // Only redirect if not already on login/home to avoid loops
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
