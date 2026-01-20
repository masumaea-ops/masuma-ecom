import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import CartDrawer from './components/CartDrawer';
import AIAssistant from './components/AIAssistant';
import Footer from './components/Footer';
import AdminLogin from './components/AdminLogin';
import ResetPassword from './components/ResetPassword';
import DashboardLayout from './components/admin/DashboardLayout';
import DashboardHome from './components/admin/DashboardHome';
import ProductManager from './components/admin/ProductManager';
import InventoryManager from './components/admin/InventoryManager';
import OrderManager from './components/admin/OrderManager';
import SalesHistory from './components/admin/SalesHistory';
import CustomerManager from './components/admin/CustomerManager';
import MpesaLogs from './components/admin/MpesaLogs';
import UserManager from './components/admin/UserManager';
import AuditLogs from './components/admin/AuditLogs';
import SettingsManager from './components/admin/SettingsManager';
import QuoteManager from './components/admin/QuoteManager';
import ReportsManager from './components/admin/ReportsManager';
import BranchManager from './components/admin/BranchManager';
import PosTerminal from './components/admin/PosTerminal';
import BlogManager from './components/admin/BlogManager';
import CmsManager from './components/admin/CmsManager';
import Profile from './components/admin/Profile';
import B2BPortal from './components/admin/B2BPortal';
import ShippingManager from './components/admin/ShippingManager';
import FinanceManager from './components/admin/FinanceManager';
import CategoryManager from './components/admin/CategoryManager';
import SubscriberManager from './components/admin/SubscriberManager';
import PartFinder from './components/PartFinder';
import Blog from './components/Blog';
import Contact from './components/Contact';
import About from './components/About';
import WarrantyPolicy from './components/WarrantyPolicy';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Toast, { ToastType } from './components/Toast';
import SEO from './components/SEO';
import QuickView from './components/QuickView';
import { ViewState, Product, CartItem } from './types';
import { apiClient } from './utils/apiClient';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [adminModule, setAdminModule] = useState('dashboard');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleRouting = async () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const productParam = params.get('product');
      const postParam = params.get('post');

      // 1. Reset Password Priority (Email link)
      if (viewParam === 'RESET_PASSWORD') {
          setView('RESET_PASSWORD');
          return;
      }

      // 2. Product Deep Link
      if (productParam) {
          try {
              if (!selectedProduct || selectedProduct.id !== productParam) {
                  const res = await apiClient.get(`/products/${productParam}`);
                  if (res.data) setSelectedProduct(res.data);
              }
          } catch (e) {}
      } else if (selectedProduct) {
          setSelectedProduct(null);
      }

      // 3. Blog Deep Link
      if (postParam) {
          setActivePostId(postParam);
          setView('BLOG');
      } 
      // 4. General View navigation
      else if (viewParam) {
          setView(viewParam as ViewState);
      }
  };

  useEffect(() => {
      handleRouting();
      const storedToken = localStorage.getItem('masuma_auth_token');
      const storedUser = localStorage.getItem('masuma_user');
      if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
      }
      const storedCart = localStorage.getItem('masuma_cart');
      if (storedCart) setCart(JSON.parse(storedCart));

      window.addEventListener('popstate', handleRouting);
      return () => window.removeEventListener('popstate', handleRouting);
  }, []);

  const openProduct = (product: Product) => {
      setSelectedProduct(product);
      const newUrl = `${window.location.pathname}?product=${product.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const clearCart = () => {
      setCart([]);
      localStorage.removeItem('masuma_cart');
      setToast({ message: 'Operation Successful!', type: 'success' });
  };

  const renderContent = () => {
    // Lock into Reset Password regardless of login state if in URL
    if (view === 'RESET_PASSWORD') {
        return <ResetPassword onBack={() => setView('LOGIN')} />;
    }

    if (view === 'DASHBOARD' && user) {
        const renderModule = () => {
            switch(adminModule) {
                case 'dashboard': return <DashboardHome onNavigate={setAdminModule} />;
                case 'products': return <ProductManager />;
                case 'inventory': return <InventoryManager />;
                case 'orders': return <OrderManager />;
                case 'sales_history': return <SalesHistory />;
                case 'customers': return <CustomerManager />;
                case 'subscribers': return <SubscriberManager />;
                case 'mpesa': return <MpesaLogs />;
                case 'users': return <UserManager />;
                case 'audit': return <AuditLogs />;
                case 'settings': return <SettingsManager />;
                case 'quotes': return <QuoteManager />;
                case 'reports': return <ReportsManager />;
                case 'branches': return <BranchManager />;
                case 'pos': return <PosTerminal />;
                case 'blog': return <BlogManager />;
                case 'cms': return <CmsManager />;
                case 'profile': return <Profile />;
                case 'b2b': return <B2BPortal />;
                case 'shipping': return <ShippingManager />;
                case 'finance': return <FinanceManager />;
                case 'categories': return <CategoryManager />;
                default: return <DashboardHome onNavigate={setAdminModule} />;
            }
        };

        return (
            <DashboardLayout activeModule={adminModule} onNavigate={setAdminModule} onLogout={() => { 
                localStorage.removeItem('masuma_auth_token');
                localStorage.removeItem('masuma_user');
                setUser(null); 
                setView('HOME'); 
            }}>
                <SEO title="Admin Dashboard" description="Masuma ERP System Internal Access" />
                {renderModule()}
            </DashboardLayout>
        );
    }

    if (view === 'LOGIN') {
        return <AdminLogin onLoginSuccess={(u, t) => { 
            setUser(u); 
            setToken(t); 
            localStorage.setItem('masuma_auth_token', t);
            localStorage.setItem('masuma_user', JSON.stringify(u));
            setView('DASHBOARD'); 
        }} onBack={() => setView('HOME')} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar cartCount={cart.reduce((a, b) => a + b.quantity, 0)} setView={setView} toggleCart={() => setIsCartOpen(true)} toggleAi={() => setIsAiOpen(true)} />
            <main className="flex-grow">
            {view === 'HOME' && (
                <>
                <SEO title="Home" description="Official distributor of Masuma automotive parts in Kenya." />
                <Hero setView={setView} />
                <ProductList addToCart={(p) => setCart([...cart, {...p, quantity: 1}])} onProductClick={openProduct} />
                </>
            )}
            {view === 'CATALOG' && <ProductList addToCart={(p) => setCart([...cart, {...p, quantity: 1}])} onProductClick={openProduct} />}
            {view === 'PART_FINDER' && <PartFinder addToCart={(p) => setCart([...cart, {...p, quantity: 1}])} />}
            {view === 'BLOG' && <Blog addToCart={(p) => setCart([...cart, {...p, quantity: 1}])} initialPostId={activePostId} onProductClick={openProduct} />}
            {view === 'ABOUT' && <About setView={setView} />}
            {view === 'CONTACT' && <Contact />}
            {view === 'WARRANTY' && <WarrantyPolicy />}
            {view === 'PRIVACY' && <PrivacyPolicy />}
            {view === 'TERMS' && <TermsOfService />}
            </main>
            <Footer setView={setView} />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cart} removeFromCart={(id) => setCart(cart.filter(i => i.id !== id))} onCheckout={clearCart} updateQuantity={(id, q) => setCart(cart.map(i => i.id === id ? {...i, quantity: q} : i))} />
            <AIAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
            <QuickView product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} addToCart={(p) => setCart([...cart, {...p, quantity: 1}])} onSwitchProduct={setSelectedProduct} />
        </div>
    );
  };

  return (
    <>
        {renderContent()}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default App;