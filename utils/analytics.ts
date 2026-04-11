import ReactGA from 'react-ga4';
import { apiClient } from './apiClient';
import { v4 as uuidv4 } from 'uuid';

// Use environment variable for the Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Session and Visitor Management
const getVisitorId = () => {
  let id = localStorage.getItem('masuma_visitor_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('masuma_visitor_id', id);
  }
  return id;
};

const getSessionId = () => {
  let id = sessionStorage.getItem('masuma_session_id');
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem('masuma_session_id', id);
  }
  return id;
};

const logInternalEvent = async (type: string, data?: any) => {
  try {
    const user = JSON.parse(localStorage.getItem('masuma_user') || 'null');
    await apiClient.post('/analytics/log', {
      type,
      data,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      userId: user?.id,
      pageUrl: window.location.href,
      referrer: document.referrer
    });
  } catch (e) {
    // Silent fail for analytics
  }
};

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log('Google Analytics Initialized');
  } else {
    console.warn('Google Analytics Measurement ID not found. Tracking disabled.');
  }
  logInternalEvent('SESSION_START');
};

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path });
  logInternalEvent('PAGE_VIEW', { path });
};

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
  logInternalEvent('CLICK', { category, action, label, value });
};

// Custom Benchmarking Events
export const trackProductView = (productName: string, category: string) => {
  trackEvent('Product', 'View', `${productName} (${category})`);
  logInternalEvent('PRODUCT_VIEW', { productName, category });
};

export const trackAddToCart = (productName: string, price: number) => {
  trackEvent('Ecommerce', 'Add to Cart', productName, price);
  logInternalEvent('ADD_TO_CART', { productName, price });
};

export const trackCheckoutInitiated = (totalAmount: number, itemCount: number) => {
  trackEvent('Ecommerce', 'Checkout Initiated', `Items: ${itemCount}`, totalAmount);
  logInternalEvent('CHECKOUT_START', { totalAmount, itemCount });
};

export const trackCheckoutComplete = (orderId: string, totalAmount: number) => {
  trackEvent('Ecommerce', 'Checkout Complete', orderId, totalAmount);
  logInternalEvent('CHECKOUT_COMPLETE', { orderId, totalAmount });
};

export const trackWhatsAppClick = (location: string) => {
  trackEvent('Support', 'WhatsApp Click', location);
};

export const trackAIInteraction = (query: string) => {
  trackEvent('AI Assistant', 'Query', query);
};

export const trackSearch = (searchTerm: string) => {
  trackEvent('Search', 'Product Search', searchTerm);
  logInternalEvent('SEARCH', { term: searchTerm });
};

export const trackShare = (platform: string, contentId: string, contentType: 'PRODUCT' | 'POST') => {
  trackEvent('Social', 'Share', `${platform} - ${contentType}: ${contentId}`);
  logInternalEvent('SHARE', { platform, contentId, contentType });
};
