
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import CartDrawer from './components/CartDrawer';
import AIAssistant from './components/AIAssistant';
import Footer from './components/Footer';
import AdminLogin from './components/AdminLogin';
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
import PartFinder from './components/PartFinder';
import Blog from './components/Blog';
import Contact from './components/Contact';
import About from './components/About';
import WarrantyPolicy from './components/WarrantyPolicy';
import Toast, { ToastType } from './components/Toast';
import { ViewState, Product, CartItem } from './types';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { CheckCircle, MessageCircle } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  
  // Admin State
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [adminModule, setAdminModule] = useState('dashboard');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
      // Check for existing session
      const storedToken = localStorage.getItem('masuma_auth_token');
      const storedUser = localStorage.getItem('masuma_user');
      if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
      }
      
      // Load Cart
      const storedCart = localStorage.getItem('masuma_cart');
      if (storedCart) setCart(JSON.parse(storedCart));
  }, []);

  useEffect(() => {
      localStorage.setItem('masuma_cart', JSON.stringify(cart));
  }, [cart]);

  const showToast = (message: string, type: ToastType = 'success') => {
      setToast({ message, type });
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    showToast(`Added ${product.name} to cart`);
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
      if (quantity < 1) return;
      setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const clearCart = () => {
      setCart([]);
      localStorage.removeItem('masuma_cart');
      showToast('Order placed successfully!');
  };

  const handleLoginSuccess = (userData: any, authToken: string) => {
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('masuma_auth_token', authToken);
      localStorage.setItem('masuma_user', JSON.stringify(userData));
      setView('DASHBOARD');
  };

  const handleLogout = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('masuma_auth_token');
      localStorage.removeItem('masuma_user');
      setView('HOME');
  };

  // Admin Dashboard Render Logic
  if (view === 'DASHBOARD' && user) {
      const renderModule = () => {
          switch(adminModule) {
              case 'dashboard': return <DashboardHome onNavigate={setAdminModule} />;
              case 'products': return <ProductManager />;
              case 'inventory': return <InventoryManager />;
              case 'orders': return <OrderManager />;
              case 'sales_history': return <SalesHistory />;
              case 'customers': return <CustomerManager />;
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
          <DashboardLayout 
            activeModule={adminModule} 
            onNavigate={setAdminModule} 
            onLogout={handleLogout}
          >
              {renderModule()}
          </DashboardLayout>
      );
  }

  if (view === 'LOGIN') {
      return <AdminLogin onLoginSuccess={handleLoginSuccess} onBack={() => setView('HOME')} />;
  }

  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar 
            cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
            setView={setView} 
            toggleCart={() => setIsCartOpen(true)}
            toggleAi={() => setIsAiOpen(true)}
        />
        
        <main className="flex-grow">
          {view === 'HOME' && (
            <>
              <Hero setView={setView} />
              <ProductList addToCart={addToCart} />
              
              <div className="bg-masuma-dark text-white py-24 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <h3 className="text-3xl md:text-4xl font-bold font-display uppercase mb-6 leading-tight">Why <span className="text-masuma-orange">Masuma?</span></h3>
                        <p className="text-gray-300 mb-8 text-lg leading-relaxed font-light">The Kenyan market is flooded with counterfeits. Masuma Autoparts EA is your firewall against fake parts.</p>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4"><div className="bg-masuma-orange/20 p-2 rounded-full text-masuma-orange"><CheckCircle size={24} /></div><div><h4 className="font-bold text-white uppercase">12-Month Warranty</h4><p className="text-sm text-gray-400">No questions asked.</p></div></li>
                            <li className="flex items-start gap-4"><div className="bg-masuma-orange/20 p-2 rounded-full text-masuma-orange"><CheckCircle size={24} /></div><div><h4 className="font-bold text-white uppercase">Locally Stocked</h4><p className="text-sm text-gray-400">Immediate availability.</p></div></li>
                        </ul>
                    </div>
                    <div className="h-[400px] rounded-lg overflow-hidden relative shadow-2xl border-4 border-white/10 group bg-white">
                        <img src="https://masuma.com/wp-content/uploads/2021/09/MFC-112_1.jpg" alt="Masuma Oil Filter" className="w-full h-full object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-75" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <h4 className="text-2xl font-display font-bold text-white mb-4 uppercase">Need Advice?</h4>
                            <button onClick={() => setIsAiOpen(true)} className="bg-masuma-orange text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-white hover:text-masuma-orange transition"><div className="flex items-center gap-2"><MessageCircle size={20} /> Chat Now</div></button>
                        </div>
                    </div>
                </div>
            </div>
            </>
          )}
          {view === 'CATALOG' && <ProductList addToCart={addToCart} />}
          {view === 'PART_FINDER' && <PartFinder addToCart={addToCart} />}
          {view === 'BLOG' && <Blog addToCart={addToCart} />}
          {view === 'ABOUT' && <About setView={setView} />}
          {view === 'CONTACT' && <Contact />}
          {view === 'WARRANTY' && <WarrantyPolicy />}
        </main>

        <Footer setView={setView} />
        
        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cartItems={cart} 
          removeFromCart={removeFromCart} 
          onCheckout={clearCart}
          updateQuantity={updateQuantity}
        />
        
        <AIAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
        
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </CurrencyProvider>
  );
};

export default App;
