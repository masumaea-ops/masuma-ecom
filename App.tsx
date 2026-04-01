import React, { useState, useEffect, useCallback } from 'react';
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
import PromoManager from './components/admin/PromoManager';
import PartFinder from './components/PartFinder';
import Blog from './components/Blog';
import Contact from './components/Contact';
import About from './components/About';
import WarrantyPolicy from './components/WarrantyPolicy';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import CookiePolicy from './components/CookiePolicy';
import Checkout from './components/Checkout';
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

  // Deep Link Resolver
  const resolveDeepLinks = useCallback(async () => {
      const params = new URLSearchParams(window.location.search);
      const productParam = params.get('product');
      const postParam = params.get('post');
      const viewParam = params.get('view');

      if (productParam) {
          try {
              const res = await apiClient.get(`/products/${productParam}`);
              if (res.data) {
                  setSelectedProduct(res.data);
              }
          } catch (e) {
              console.error("Deep linked product not found");
          }
      }

      if (postParam) {
          setActivePostId(postParam);
          setView('BLOG');
      } 
      else if (viewParam) {
          setView(viewParam as ViewState);
      }
  }, []);

  useEffect(() => {
      resolveDeepLinks();
      
      const storedToken = localStorage.getItem('masuma_auth_token');
      const storedUser = localStorage.getItem('masuma_user');
      if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
      }
      const storedCart = localStorage.getItem('masuma_cart');
      if (storedCart) setCart(JSON.parse(storedCart));

      const handlePopState = () => {
          const params = new URLSearchParams(window.location.search);
          if (!params.get('product')) setSelectedProduct(null);
          if (!params.get('post')) setActivePostId(null);
          if (!params.get('view') && !params.get('product') && !params.get('post')) setView('HOME');
          resolveDeepLinks();
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, [resolveDeepLinks]);

  const openProduct = (product: Product) => {
      setSelectedProduct(product);
      const newUrl = `${window.location.pathname}?product=${product.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const closeProduct = () => {
      setSelectedProduct(null);
      const params = new URLSearchParams(window.location.search);
      params.delete('product');
      const newSearch = params.toString();
      const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const navigateToPost = (postId: string) => {
      setActivePostId(postId);
      setView('BLOG');
      const newUrl = `${window.location.pathname}?post=${postId}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      window.scrollTo(0, 0);
  };

  const clearCart = () => {
      setCart([]);
      localStorage.removeItem('masuma_cart');
      setToast({ message: 'Operation Successful!', type: 'success' });
  };

  const renderContent = () => {
    if (view === 'RESET_PASSWORD') {
        return <ResetPassword onBack={() => setView('LOGIN')} />;
    }

    if (view === 'DASHBOARD' && user) {
        return (
            <DashboardLayout activeModule={adminModule} onNavigate={setAdminModule} onLogout={() => { 
                localStorage.removeItem('masuma_auth_token');
                localStorage.removeItem('masuma_user');
                setUser(null); 
                setView('HOME'); 
            }}>
                <SEO title="Admin Dashboard" description="Masuma ERP System Internal Access" />
                {(() => {
                    switch(adminModule) {
                        case 'dashboard': return <DashboardHome onNavigate={setAdminModule} />;
                        case 'products': return <ProductManager />;
                        case 'promos': return <PromoManager />;
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
                })()}
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
                <SEO 
                    title="Genuine Japanese Spare Parts in Nairobi" 
                    description="Masuma Autoparts East Africa. Official distributor of Japanese precision automotive parts in Nairobi, Kenya. 12-month warranty on filters, brakes, spark plugs, and suspension." 
                    keywords="Masuma Kenya, car parts Nairobi, Japanese spare parts Kenya, Toyota parts Kenya, Nissan parts Kenya, genuine spark plugs Kenya, Masuma spark plugs Nairobi, brake pads Kenya, oil filters Nairobi"
                />
                <Hero setView={setView} />
                
                {/* Popular Categories Section for SEO */}
                <section className="bg-white py-12 border-b border-gray-100">
                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                            <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase tracking-tight">Popular Categories</h2>
                            <button onClick={() => setView('CATALOG')} className="text-masuma-orange font-bold text-xs uppercase tracking-widest hover:underline">View All Parts</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {[
                                { name: 'Spark Plugs', icon: '⚡' },
                                { name: 'Brake Pads', icon: '🛑' },
                                { name: 'Oil Filters', icon: '🛢️' },
                                { name: 'Suspension', icon: '🏎️' },
                                { name: 'Belts', icon: '➰' },
                                { name: 'Wipers', icon: '🌧️' }
                            ].map((cat) => (
                                <a 
                                    key={cat.name}
                                    href="/?view=CATALOG"
                                    onClick={(e) => { e.preventDefault(); setView('CATALOG'); }}
                                    className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl hover:bg-masuma-orange hover:text-white transition-all group"
                                >
                                    <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{cat.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>

                <ProductList addToCart={(p) => setCart([...cart, {...p, quantity: 1}])} onProductClick={openProduct} />
                </>
            )}
            {view === 'CATALOG' && (
                <>
                <SEO 
                    title="Automotive Parts Catalog | Masuma Kenya" 
                    description="Browse our extensive catalog of genuine Masuma automotive parts. High-quality spark plugs, filters, brakes, and suspension components for Japanese vehicles in Kenya." 
                    keywords="car parts catalog Kenya, Masuma inventory Nairobi, automotive components Kenya, spark plugs Kenya, brake pads Nairobi, suspension parts Kenya"
                />
                <ProductList addToCart={(p) => setCart([...cart, {...p, quantity: 1}])} onProductClick={openProduct} />
                </>
            )}
            {view === 'PART_FINDER' && (
                <>
                <SEO 
                    title="VIN & Part Finder | Find Car Parts in Kenya" 
                    description="Use our advanced VIN and part finder to locate the exact genuine Masuma component for your vehicle. Precision fitment for Kenyan roads." 
                    keywords="VIN search Kenya, part finder Nairobi, car part lookup Kenya"
                />
                <PartFinder addToCart={(p) => setCart([...cart, {...p, quantity: 1}])} />
                </>
            )}
            {view === 'BLOG' && (
                <>
                <SEO 
                    title="Automotive News & Maintenance Tips | Masuma Kenya" 
                    description="Stay updated with the latest automotive news, maintenance tips, and product guides from Masuma Autoparts East Africa." 
                    keywords="car maintenance tips Kenya, automotive blog Nairobi, Masuma news Kenya"
                />
                <Blog addToCart={(p) => setCart([...cart, {...p, quantity: 1}])} initialPostId={activePostId} onProductClick={openProduct} onNavigateToPost={navigateToPost} />
                </>
            )}
            {view === 'ABOUT' && (
                <>
                <SEO 
                    title="About Masuma Autoparts East Africa" 
                    description="Learn about Masuma Autoparts East Africa, the leading distributor of genuine Japanese automotive parts in Kenya and the East African region." 
                />
                <About setView={setView} />
                </>
            )}
            {view === 'CONTACT' && (
                <>
                <SEO 
                    title="Contact Us | Masuma Nairobi Office" 
                    description="Get in touch with Masuma Autoparts East Africa. Visit our Nairobi office or contact us for genuine Japanese spare parts inquiries." 
                />
                <Contact />
                </>
            )}
            {view === 'WARRANTY' && (
                <>
                <SEO title="Warranty Policy | 12-Month Guarantee" description="Read about our 12-month warranty policy on all genuine Masuma automotive parts sold in Kenya." />
                <WarrantyPolicy />
                </>
            )}
            {view === 'PRIVACY' && (
                <>
                <SEO title="Privacy Policy | Masuma Kenya" description="Our commitment to protecting your privacy and personal data at Masuma Autoparts East Africa." />
                <PrivacyPolicy />
                </>
            )}
            {view === 'TERMS' && (
                <>
                <SEO title="Terms of Service | Masuma Kenya" description="Terms and conditions for using the Masuma Autoparts East Africa website and services." />
                <TermsOfService />
                </>
            )}
            {view === 'COOKIES' && (
                <>
                <SEO title="Cookie Policy | Masuma Kenya" description="Information about how we use cookies on the Masuma Autoparts East Africa website." />
                <CookiePolicy />
                </>
            )}
            {view === 'CHECKOUT' && (
                <>
                <SEO title="Secure Checkout | Masuma Kenya" description="Complete your purchase of genuine Masuma automotive parts securely with M-Pesa or Card." />
                <Checkout cartItems={cart} onSuccess={clearCart} setView={setView} />
                </>
            )}
            </main>
            <Footer setView={setView} />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cart} removeFromCart={(id) => setCart(cart.filter(i => i.id !== id))} onCheckout={() => { setIsCartOpen(false); setView('CHECKOUT'); }} updateQuantity={(id, q) => setCart(cart.map(i => i.id === id ? {...i, quantity: q} : i))} />
            <AIAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
            <QuickView product={selectedProduct} isOpen={!!selectedProduct} onClose={closeProduct} addToCart={(p) => setCart([...cart, {...p, quantity: 1}])} onSwitchProduct={setSelectedProduct} />
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