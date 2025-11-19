
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductList from './components/ProductList';
import CartDrawer from './components/CartDrawer';
import AIAssistant from './components/AIAssistant';
import Footer from './components/Footer';
import Toast, { ToastType } from './components/Toast';
import Blog from './components/Blog';
import { CartItem, Product, ViewState } from './types';
import { MapPin, CheckCircle, MessageCircle, ArrowUp, Star, Quote } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{message: string, type: ToastType} | null>(null);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Handle Scroll for Back-to-Top button
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

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to cart`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    // In a real app, this would redirect to a payment gateway or order form
    setIsCartOpen(false);
    setCart([]);
    showToast('Order request sent successfully! We will contact you shortly.', 'success');
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const renderView = () => {
    switch (currentView) {
      case 'HOME':
        return (
          <div className="animate-fade-in">
            <Hero setView={setCurrentView} />
            
            {/* Featured Products */}
            <div className="bg-white py-20">
               <div className="max-w-7xl mx-auto px-4 text-center mb-16">
                  <span className="text-masuma-orange font-bold uppercase tracking-widest text-xs mb-2 block">Our Best Sellers</span>
                  <h2 className="text-4xl font-bold text-masuma-dark font-display uppercase tracking-wide">Featured Products</h2>
                  <div className="h-1 w-24 bg-masuma-dark mx-auto mt-4 mb-6"></div>
                  <p className="text-gray-600 max-w-2xl mx-auto text-lg">Top-selling, high-endurance parts specifically curated for Kenyan roads and driving conditions.</p>
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

            {/* Testimonials Section - Social Proof */}
            <div className="bg-gray-50 py-24 border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                   <h2 className="text-3xl font-bold text-masuma-dark font-display uppercase">Trusted by Nairobi's Best</h2>
                   <div className="h-1 w-24 bg-masuma-orange mx-auto mt-4"></div>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      name: "John Kamau",
                      role: "Head Mechanic, Kirinyaga Rd",
                      text: "I used to replace bushings on Vitz taxis every 3 months. Since switching to Masuma, my customers go over a year without issues. The rubber quality is just different.",
                      stars: 5
                    },
                    {
                      name: "Sarah Ochieng",
                      role: "Fleet Manager, Super Metro",
                      text: "For our long-distance Matatus, downtime is money. Masuma brake pads handle the heat on the Naivasha escarpment better than any other brand we've tested.",
                      stars: 5
                    },
                    {
                      name: "David Patel",
                      role: "Car Enthusiast (Subaru)",
                      text: "Finding genuine parts for my Forester SG5 is a headache in Nairobi. Masuma's online catalog makes it easy to find the exact part number. Delivery was same-day.",
                      stars: 5
                    }
                  ].map((testimony, i) => (
                    <div key={i} className="bg-white p-8 shadow-lg rounded-sm border-b-4 border-transparent hover:border-masuma-orange transition duration-300 group">
                      <div className="mb-4 text-masuma-orange">
                        <Quote size={32} className="opacity-30 group-hover:opacity-100 transition" />
                      </div>
                      <p className="text-gray-600 italic mb-6 leading-relaxed">"{testimony.text}"</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-masuma-dark uppercase text-sm">{testimony.name}</h4>
                          <span className="text-xs text-gray-500">{testimony.role}</span>
                        </div>
                        <div className="flex text-yellow-400">
                          {[...Array(testimony.stars)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Brand Promise */}
            <div className="bg-masuma-dark text-white py-24 relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <h3 className="text-3xl md:text-4xl font-bold font-display uppercase mb-6 leading-tight">
                            Why <span className="text-masuma-orange">Masuma?</span>
                        </h3>
                        <p className="text-gray-300 mb-8 text-lg leading-relaxed font-light">
                            The Kenyan market is flooded with substandard counterfeits. Masuma Autoparts East Africa Limited is the firewall against fake parts. 
                            We guarantee 100% authentic Japanese engineering, delivering factory-grade performance for your Toyota, Subaru, or Nissan.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <div className="bg-masuma-orange/20 p-2 rounded-full text-masuma-orange"><CheckCircle size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-white uppercase">12-Month Warranty</h4>
                                    <p className="text-sm text-gray-400">No questions asked replacement guarantee.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="bg-masuma-orange/20 p-2 rounded-full text-masuma-orange"><CheckCircle size={24} /></div>
                                <div>
                                    <h4 className="font-bold text-white uppercase">Locally Stocked</h4>
                                    <p className="text-sm text-gray-400">Immediate availability in Nairobi Industrial Area.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div className="h-[400px] rounded-lg overflow-hidden relative shadow-2xl border-4 border-white/10 group">
                        <img 
                            src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                            alt="Masuma Workshop" 
                            className="w-full h-full object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-75" 
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500">
                            <h4 className="text-2xl font-display font-bold text-white mb-4 uppercase">Need Expert Advice?</h4>
                            <button 
                                onClick={() => setIsAiOpen(true)} 
                                className="bg-masuma-orange text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-white hover:text-masuma-orange transition transform hover:-translate-y-1"
                            >
                                <div className="flex items-center gap-2">
                                    <MessageCircle size={20} />
                                    Chat Now
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        );
      case 'CATALOG':
        return (
            <div className="animate-fade-in bg-white">
                <div className="bg-gray-100 py-12 border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4">
                        <h1 className="text-4xl font-bold text-masuma-dark font-display uppercase">Full Catalog</h1>
                        <p className="text-gray-500 mt-2">Browsing all available parts in Nairobi warehouse</p>
                    </div>
                </div>
                <ProductList addToCart={addToCart} />
            </div>
        );
      case 'BLOG':
        return <Blog addToCart={addToCart} />;
      case 'ABOUT':
        return (
            <div className="animate-fade-in">
                <div className="relative bg-masuma-dark py-24">
                    <div className="absolute inset-0 overflow-hidden">
                        <img src="https://masuma.com/wp-content/uploads/2021/09/factory.jpg" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" alt="Factory" />
                    </div>
                    <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                        <h2 className="text-5xl font-bold text-white mb-6 font-display uppercase tracking-tight">Engineering Trust</h2>
                        <div className="h-1.5 w-24 bg-masuma-orange mx-auto mb-8"></div>
                        <p className="text-xl text-gray-300 leading-relaxed">
                            Masuma Autoparts East Africa Limited is more than a distributor. We are the bridge between Japanese precision and African resilience.
                        </p>
                    </div>
                </div>
                <div className="max-w-4xl mx-auto px-4 py-20">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="prose prose-lg text-gray-600">
                            <h3 className="text-2xl font-bold text-masuma-dark uppercase mb-4">Our Story</h3>
                            <p>
                                Founded in Nairobi's Industrial Area, we recognized a critical gap in the market: vehicle owners were forced to choose between prohibitively expensive dealer parts or unreliable counterfeits.
                            </p>
                            <p>
                                Masuma fills this gap. As a global brand with its own factories, we control quality from raw material to final box. By establishing a direct distribution hub in East Africa, we cut out middlemen to bring you OEM quality at aftermarket prices.
                            </p>
                        </div>
                        <div className="bg-gray-50 p-8 border-l-4 border-masuma-orange shadow-lg">
                            <h3 className="text-xl font-bold mb-6 text-masuma-dark uppercase">The Masuma Promise</h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <CheckCircle className="text-masuma-orange shrink-0" />
                                    <span className="text-gray-700">Defect rate below 0.02% globally.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle className="text-masuma-orange shrink-0" />
                                    <span className="text-gray-700">Components tested for high-dust environments.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle className="text-masuma-orange shrink-0" />
                                    <span className="text-gray-700">Full traceability via SKU and Lot numbers.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
      case 'CONTACT':
        return (
            <div className="animate-fade-in bg-white min-h-screen">
                <div className="bg-masuma-dark text-white py-16">
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className="text-4xl font-bold font-display uppercase">Contact Us</h2>
                        <p className="text-masuma-orange mt-2 font-medium">We are here to help you find the right part.</p>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
                    <div className="grid md:grid-cols-3 gap-8">
                         {/* Contact Cards */}
                         <div className="bg-white p-8 shadow-xl border-t-4 border-masuma-orange text-center group hover:-translate-y-2 transition duration-300">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-masuma-orange group-hover:text-white transition">
                                <MapPin size={32} />
                            </div>
                            <h4 className="font-bold text-masuma-dark uppercase mb-2">Visit Us</h4>
                            <p className="text-gray-500 text-sm">Godown 4, Enterprise Road<br/>Industrial Area, Nairobi</p>
                         </div>

                         <div className="bg-white p-8 shadow-xl border-t-4 border-masuma-dark text-center group hover:-translate-y-2 transition duration-300">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-masuma-dark group-hover:text-white transition">
                                <MessageCircle size={32} />
                            </div>
                            <h4 className="font-bold text-masuma-dark uppercase mb-2">Call Us</h4>
                            <p className="text-gray-500 text-sm">+254 700 123 456<br/>+254 20 555 555</p>
                         </div>

                         <div className="bg-white p-8 shadow-xl border-t-4 border-masuma-orange text-center group hover:-translate-y-2 transition duration-300">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-masuma-orange group-hover:text-white transition">
                                <MessageCircle size={32} />
                            </div>
                            <h4 className="font-bold text-masuma-dark uppercase mb-2">Email Us</h4>
                            <p className="text-gray-500 text-sm">sales@masuma.co.ke<br/>support@masuma.co.ke</p>
                         </div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 py-16">
                    <h3 className="text-2xl font-bold text-masuma-dark text-center uppercase mb-8">Send a Message</h3>
                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); showToast('Message Sent! We will contact you shortly.'); }}>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">First Name</label>
                                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-masuma-orange outline-none transition" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Last Name</label>
                                <input type="text" className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-masuma-orange outline-none transition" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">Email Address</label>
                            <input type="email" className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-masuma-orange outline-none transition" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">Message</label>
                            <textarea className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-masuma-orange outline-none h-40 transition" required></textarea>
                        </div>
                        <button className="w-full bg-masuma-dark text-white py-4 font-bold uppercase tracking-widest hover:bg-masuma-orange transition shadow-lg">
                            Submit Inquiry
                        </button>
                    </form>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
      <Navbar 
        cartCount={cartCount} 
        setView={setCurrentView} 
        toggleCart={() => setIsCartOpen(true)}
        toggleAi={() => setIsAiOpen(true)}
      />
      
      <main className="flex-grow">
        {renderView()}
      </main>

      <Footer />

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 p-3 bg-masuma-orange text-white shadow-xl transition-all duration-300 hover:bg-masuma-dark ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        title="Back to Top"
      >
        <ArrowUp size={24} />
      </button>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cart} 
        removeFromCart={removeFromCart} 
        onCheckout={handleCheckout}
      />

      <AIAssistant 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

export default App;
