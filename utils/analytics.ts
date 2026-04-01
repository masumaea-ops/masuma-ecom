import ReactGA from 'react-ga4';

// Use environment variable for the Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log('Google Analytics Initialized');
  } else {
    console.warn('Google Analytics Measurement ID not found. Tracking disabled.');
  }
};

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

// Custom Benchmarking Events
export const trackProductView = (productName: string, category: string) => {
  trackEvent('Product', 'View', `${productName} (${category})`);
};

export const trackAddToCart = (productName: string, price: number) => {
  trackEvent('Ecommerce', 'Add to Cart', productName, price);
};

export const trackCheckoutInitiated = (totalAmount: number, itemCount: number) => {
  trackEvent('Ecommerce', 'Checkout Initiated', `Items: ${itemCount}`, totalAmount);
};

export const trackWhatsAppClick = (location: string) => {
  trackEvent('Support', 'WhatsApp Click', location);
};

export const trackAIInteraction = (query: string) => {
  trackEvent('AI Assistant', 'Query', query);
};

export const trackSearch = (searchTerm: string) => {
  trackEvent('Search', 'Product Search', searchTerm);
};
