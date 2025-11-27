import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import CartDrawer from './components/CartDrawer';
import AIAssistant from './components/AIAssistant';
import Footer from './components/Footer';
import Toast, { ToastType } from './components/Toast';
import Blog from './components/Blog';
import DashboardLayout from './components/admin/DashboardLayout';
import PosTerminal from './components/admin/PosTerminal';
import InventoryManager from './components/admin/InventoryManager';
import DashboardHome from './components/admin/DashboardHome';
import ProductManager from './components/admin/ProductManager';
import BlogManager from './components/admin/BlogManager';
import CmsManager from './components/admin/CmsManager';
import OrderManager from './components/admin/OrderManager';
import SalesHistory from './components/admin/SalesHistory';
import MpesaLogs from './components/admin/MpesaLogs';
import CustomerManager from './components/admin/CustomerManager';
import SettingsManager from './components/admin/SettingsManager';
import QuoteManager from './components/admin/QuoteManager';
import ReportsManager from './components/admin/ReportsManager';
import UserManager from './components/admin/UserManager';
import AuditLogs from './components/admin/AuditLogs';
import B2BPortal from './components/admin/B2BPortal';
import ShippingManager from './components/admin/ShippingManager';
import Profile from './components/admin/Profile';
import BranchManager from './components/admin/BranchManager';
import CategoryManager from './components/admin/CategoryManager';
import FinanceManager from './components/admin/FinanceManager'; // Added
import NotFound from './components/NotFound';
import PartFinder from './components/PartFinder';
import AdminLogin from './components/AdminLogin';
import { CartItem, Product, ViewState } from './types';
import { CheckCircle, MessageCircle, ArrowUp, Star, Quote, Package, Lock, Loader2, MapPin, Send } from 'lucide-react';
import { apiClient } from './utils/apiClient';
import { CurrencyProvider } from './contexts/CurrencyContext';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);

  // Admin State
  const [adminModule, setAdminModule] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSending, setContactSending] = useState(false);

  // Check for existing token on load
  useEffect(() => {
    const token = localStorage.getItem('masuma_auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    
    const msg = quantity > 1 
      ? `Added ${quantity} x ${product.name} to cart`
      : `Added ${product.name} to cart`;
      
    showToast(msg);
  };

  const updateCartQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Triggered when a modal (Mpesa or Manual) completes successfully
  const handleOrderSuccess = () => {
    setIsCartOpen(false);
    setCart([]);
    showToast('Order placed successfully! Ref: ' + `ORD-${Date.now().toString().slice(-4)}`, 'success');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setContactSending(true);
      try {
          await apiClient.post('/contact', contactForm);
          showToast('Message sent! We will contact you shortly.', 'success');
          setContactForm({ name: '', email: '', subject: '', message: '' });
      } catch (error) {
          showToast('Failed to send message. Please try again.', 'error');
      } finally {
          setContactSending(false);
      }
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // --- Admin/Dashboard Logic ---
  const handleLoginSuccess = (user: any, token: string) => {
      localStorage.setItem('masuma_auth_token', token);
      localStorage.setItem('masuma_user', JSON.stringify(user));
      
      setIsAuthenticated(true);
      setCurrentView('DASHBOARD');
      showToast(`Welcome back, ${user.name}`, 'success');
  };

  const handleLogout = () => {
      localStorage.removeItem('masuma_auth_token');
      localStorage.removeItem('masuma_user');
      setIsAuthenticated(false);
      setCurrentView('HOME');
      showToast('Logged out successfully', 'success');
  };

  if (currentView === 'LOGIN') {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} onBack={() => setCurrentView('HOME')} />;
  }

  if (currentView === 'DASHBOARD') {
      if (!isAuthenticated) {
          setCurrentView('LOGIN');
          return null;
      }
      return (
        <CurrencyProvider>
          <DashboardLayout 
            activeModule={adminModule} 
            onNavigate={setAdminModule} 
            onLogout={handleLogout}
          >
            {adminModule === 'dashboard' && <DashboardHome onNavigate={setAdminModule} />}
            {adminModule === 'finance' && <FinanceManager />} 
            {adminModule === 'pos' && <PosTerminal />}
            {adminModule === 'products' && <ProductManager />}
            {adminModule === 'categories' && <CategoryManager />}
            {adminModule === 'orders' && <OrderManager />}
            {adminModule === 'inventory' && <InventoryManager />}
            {adminModule === 'branches' && <BranchManager />}
            {adminModule === 'sales_history' && <SalesHistory />}
            {adminModule === 'mpesa' && <MpesaLogs />}
            {adminModule === 'customers' && <CustomerManager />}
            {adminModule === 'quotes' && <QuoteManager />}
            {adminModule === 'reports' && <ReportsManager />}
            {adminModule === 'users' && <UserManager />}
            {adminModule === 'audit' && <AuditLogs />}
            {adminModule === 'blog' && <BlogManager />}
            {adminModule === 'cms' && <CmsManager />}
            {adminModule === 'settings' && <SettingsManager />}
            {adminModule === 'b2b' && <B2BPortal />}
            {adminModule === 'shipping' && <ShippingManager />}
            {adminModule === 'profile' && <Profile />}
            
            {!['dashboard', 'finance', 'pos', 'products', 'categories', 'orders', 'inventory', 'branches', 'sales_history', 'mpesa', 'customers', 'quotes', 'reports', 'users', 'audit', 'blog', 'cms', 'settings', 'b2b', 'shipping', 'profile'].includes(adminModule) && (
                 <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                    <Package size={64} className="mb-4 opacity-20" />
                    <h2 className="text-2xl font-bold uppercase text-masuma-dark">Module Under Construction</h2>
                    <p>The {adminModule} module is currently being engineered.</p>
                 </div>
            )}
          </DashboardLayout>
        </CurrencyProvider>
      );
  }

  // --- Public Storefront Render ---
  const renderView = () => {
    switch (currentView) {
      case 'HOME':
        return (
          <div className="animate-fade-in">
            <Hero setView={setCurrentView} />
            <div className="bg-white py-20">
               <div className="max-w-7xl mx-auto px-4 text-center mb-16">
                  <span className="text-masuma-orange font-bold uppercase tracking-widest text-xs mb-2 block">Our Best Sellers</span>
                  <h2 className="text-4xl font-bold text-masuma-dark font-display uppercase tracking-wide">Featured Products</h2>
                  <div className="h-1 w-24 bg-masuma-dark mx-auto mt-4 mb-6"></div>
                  <p className="text-gray-600 max-w-2xl mx-auto text-lg">Top-selling, high-endurance parts specifically curated for Kenyan roads.</p>
               </div>
               <ProductList addToCart={addToCart} />
               <div className="text-center mt-12">
                  <button 
                    onClick={() => setCurrentView('CATALOG')}
                    className="inline-flex items-center bg-transparent border-2 border-masuma-dark text-masuma-dark hover:bg-masuma-dark hover:text-white font-bold py-3 px-8 uppercase tracking-widest transition-all duration-300"
                  >
                    View Full Catalog
                  </button>
               </div>
            </div>

            {/* Testimonials */}
            <div className="bg-gray-50 py-24 border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                   <h2 className="text-3xl font-bold text-masuma-dark font-display uppercase">Trusted by Nairobi's Best</h2>
                   <div className="h-1 w-24 bg-masuma-orange mx-auto mt-4"></div>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { name: "John Kamau", role: "Head Mechanic, Kirinyaga Rd", text: "Since switching to Masuma, my customers go over a year without issues.", stars: 5 },
                    { name: "Sarah Ochieng", role: "Fleet Manager, Super Metro", text: "Masuma brake pads handle the heat on the Naivasha escarpment better than any other brand.", stars: 5 },
                    { name: "David Patel", role: "Car Enthusiast", text: "Masuma's online catalog makes it easy to find the exact part number.", stars: 5 }
                  ].map((testimony, i) => (
                    <div key={i} className="bg-white p-8 shadow-lg rounded-sm border-b-4 border-transparent hover:border-masuma-orange transition duration-300 group">
                      <div className="mb-4 text-masuma-orange"><Quote size={32} className="opacity-30 group-hover:opacity-100 transition" /></div>
                      <p className="text-gray-600 italic mb-6 leading-relaxed">"{testimony.text}"</p>
                      <div className="flex items-center justify-between">
                        <div><h4 className="font-bold text-masuma-dark uppercase text-sm">{testimony.name}</h4><span className="text-xs text-gray-500">{testimony.role}</span></div>
                        <div className="flex text-yellow-400">{[...Array(testimony.stars)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
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
                    <div className="h-[400px] rounded-lg overflow-hidden relative shadow-2xl border-4 border-white/10 group">
                        <img src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Workshop" className="w-full h-full object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-75" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <h4 className="text-2xl font-display font-bold text-white mb-4 uppercase">Need Advice?</h4>
                            <button onClick={() => setIsAiOpen(true)} className="bg-masuma-orange text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-white hover:text-masuma-orange transition"><div className="flex items-center gap-2"><MessageCircle size={20} /> Chat Now</div></button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        );
      case 'CATALOG':
        return <div className="animate-fade-in bg-white"><div className="bg-gray-100 py-12 border-b border-gray-200"><div className="max-w-7xl mx-auto px-4"><h1 className="text-4xl font-bold text-masuma-dark font-display uppercase">Full Catalog</h1></div></div><ProductList addToCart={addToCart} /></div>;
      case 'PART_FINDER':
        return <PartFinder addToCart={addToCart} />;
      case 'BLOG': return <Blog addToCart={addToCart} />;
      case 'ABOUT':
        return (
            <div className="animate-fade-in">
                <div className="relative bg-masuma-dark py-24">
                    <div className="absolute inset-0 overflow-hidden"><img src="https://masuma.com/wp-content/uploads/2021/09/factory.jpg" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" alt="Factory" /></div>
                    <div className="max-w-4xl mx-auto px-4 text-center relative z-10"><h2 className="text-5xl font-bold text-white mb-6 font-display uppercase tracking-tight"><div className="h-1.5 w-24 bg-masuma-orange mx-auto mb-8"></div>Engineering Trust</h2><p className="text-xl text-gray-300 leading-relaxed">Masuma Autoparts East Africa Limited is the bridge between Japanese precision and African resilience.</p></div>
                </div>
                <div className="max-w-4xl mx-auto px-4 py-20">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="prose prose-lg text-gray-600"><h3 className="text-2xl font-bold text-masuma-dark uppercase">Our Story</h3><p>Founded in Nairobi's Industrial Area, we fill the gap between expensive dealer parts and unreliable counterfeits.</p></div>
                        <div className="bg-gray-50 p-8 border-l-4 border-masuma-orange shadow-lg"><h3 className="text-xl font-bold mb-6 text-masuma-dark uppercase">The Masuma Promise</h3><ul className="space-y-4"><li className="flex gap-3"><CheckCircle className="text-masuma-orange shrink-0" /><span className="text-gray-700">Defect rate below 0.02%.</span></li><li className="flex gap-3"><CheckCircle className="text-masuma-orange shrink-0" /><span className="text-gray-700">Tested for high-dust environments.</span></li></ul></div>
                    </div>
                </div>
            </div>
        );
      case 'CONTACT':
        return (
            <div className="animate-fade-in bg-white min-h-screen">
                <div className="bg-masuma-dark text-white py-16"><div className="max-w-7xl mx-auto px-4"><h2 className="text-4xl font-bold font-display uppercase">Contact Us</h2></div></div>
                <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                         <div className="bg-white p-8 shadow-xl border-t-4 border-masuma-orange text-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"><MapPin size={32} /></div><h4 className="font-bold text-masuma-dark uppercase mb-2">Visit Us</h4><p className="text-gray-500 text-sm">Godown 4, Enterprise Road<br/>Industrial Area, Nairobi</p></div>
                         <div className="bg-white p-8 shadow-xl border-t-4 border-masuma-dark text-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"><MessageCircle size={32} /></div><h4 className="font-bold text-masuma-dark uppercase mb-2">Call Us</h4><p className="text-gray-500 text-sm">+254 700 123 456</p></div>
                         <div className="bg-white p-8 shadow-xl border-t-4 border-masuma-orange text-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"><MessageCircle size={32} /></div><h4 className="font-bold text-masuma-dark uppercase mb-2">Email Us</h4><p className="text-gray-500 text-sm">sales@masuma.africa</p></div>
                    </div>

                    <div className="bg-white p-8 shadow-lg border border-gray-100 rounded-lg max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-masuma-dark uppercase mb-6 text-center">Send a Message</h3>
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none"
                                        value={contactForm.name}
                                        onChange={e => setContactForm({...contactForm, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email</label>
                                    <input 
                                        type="email" 
                                        required 
                                        className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none"
                                        value={contactForm.email}
                                        onChange={e => setContactForm({...contactForm, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Subject</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none"
                                    value={contactForm.subject}
                                    onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Message</label>
                                <textarea 
                                    required 
                                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-32 resize-none"
                                    value={contactForm.message}
                                    onChange={e => setContactForm({...contactForm, message: e.target.value})}
                                ></textarea>
                            </div>
                            <button 
                                type="submit" 
                                disabled={contactSending}
                                className="w-full bg-masuma-dark text-white py-3 font-bold uppercase tracking-widest hover:bg-masuma-orange transition flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {contactSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />} 
                                {contactSending ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
      default:
        return <NotFound />; 
    }
  };

  return (
    <CurrencyProvider>
        <div className="flex flex-col min-h-screen font-sans bg-white">
        <Navbar cartCount={cartCount} setView={setCurrentView} toggleCart={() => setIsCartOpen(true)} toggleAi={() => setIsAiOpen(true)} />
        <main className="flex-grow">{renderView()}</main>
        <Footer />
        <button onClick={scrollToTop} className={`fixed bottom-6 right-6 z-40 p-3 bg-masuma-orange text-white shadow-xl transition-all duration-300 hover:bg-masuma-dark ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`} title="Back to Top"><ArrowUp size={24} /></button>
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cart} removeFromCart={removeFromCart} onCheckout={handleOrderSuccess} updateQuantity={updateCartQuantity} />
        <AIAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    </CurrencyProvider>
  );
}

export default App;