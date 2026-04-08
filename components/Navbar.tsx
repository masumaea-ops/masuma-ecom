
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Bot, Phone, MessageCircle, MapPin, User, ChevronDown, Plane } from 'lucide-react';
import { ViewState } from '../types';
import { useCurrency, CurrencyCode } from '../contexts/CurrencyContext';
import { apiClient } from '../utils/apiClient';
import SourcingModal from './SourcingModal';
import { Logo } from './Logo';

interface NavbarProps {
  cartCount: number;
  setView: (view: ViewState) => void;
  toggleCart: () => void;
  toggleAi: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, setView, toggleCart, toggleAi }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [contactPhone, setContactPhone] = useState('+254 792 506 590'); // Default
  const [isSourcingOpen, setIsSourcingOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Fetch settings
    const fetchSettings = async () => {
        try {
            const res = await apiClient.get('/settings');
            if (res.data && res.data.CMS_HEADER_PHONE) {
                setContactPhone(res.data.CMS_HEADER_PHONE);
            }
        } catch (e) {
            // Ignore error, use default
        }
    };
    fetchSettings();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: ViewState[] = ['HOME', 'CATALOG', 'PART_FINDER', 'BLOG', 'ABOUT', 'CONTACT'];
  const currencies: CurrencyCode[] = ['KES', 'USD', 'UGX', 'TZS', 'RWF'];

  const formatNavLabel = (item: string) => {
      if (item === 'PART_FINDER') return 'PART FINDER';
      return item;
  };

  const handleNav = (e: React.MouseEvent, view: ViewState) => {
      e.preventDefault();
      setView(view);
      
      // Update URL for Deep Linking / SEO
      const newUrl = view === 'HOME' ? '/' : `/?view=${view}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      window.scrollTo(0, 0);
      setIsMenuOpen(false);
  };

  return (
    <>
      {/* TOP UTILITY BAR */}
      <div className="bg-masuma-dark text-white text-xs font-medium py-2.5 border-b border-gray-800 hidden md:block transition-colors relative z-[102]">
         <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            {/* Left: Contact & Chat */}
            <div className="flex items-center space-x-6">
               <span className="flex items-center gap-2 opacity-80 hover:opacity-100 transition cursor-default">
                 <Phone size={12} className="text-masuma-orange" />
                 Call us between 8 AM - 6 PM / <span className="text-white font-bold">{contactPhone}</span>
               </span>
               <button onClick={toggleAi} className="flex items-center gap-2 opacity-80 hover:opacity-100 transition hover:text-masuma-orange">
                 <MessageCircle size={12} className="text-masuma-orange" />
                 Live Chat / Chat with an Expert
               </button>
            </div>

            {/* Right: Locations, Settings, Login */}
            <div className="flex items-center divide-x divide-gray-700">
               <button onClick={() => setIsSourcingOpen(true)} className="flex items-center gap-2 px-4 text-masuma-orange font-bold hover:text-white transition uppercase tracking-wider">
                 <Plane size={12} className="transform -rotate-45" /> Special Orders
               </button>
               <a href="/?view=CONTACT" onClick={(e) => handleNav(e, 'CONTACT')} className="flex items-center gap-2 px-4 opacity-80 hover:opacity-100 transition hover:text-masuma-orange">
                 <MapPin size={12} /> Locations
               </a>
               <div className="flex items-center gap-4 px-4 relative z-[1001]">
                  <div className="relative">
                    <button 
                        onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                        className="cursor-pointer hover:text-masuma-orange flex items-center gap-1 transition opacity-80 hover:opacity-100"
                    >
                        {currency} <ChevronDown size={10}/>
                    </button>
                    {isCurrencyOpen && (
                        <div className="absolute top-8 right-0 bg-white text-masuma-dark shadow-2xl rounded-sm border border-gray-200 z-[1005] w-24 animate-slide-up">
                            {currencies.map(c => (
                                <button 
                                    key={c}
                                    onClick={() => { setCurrency(c); setIsCurrencyOpen(false); }}
                                    className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 border-b border-gray-50 last:border-0 ${currency === c ? 'font-bold text-masuma-orange' : ''}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
                  <button className="cursor-pointer hover:text-masuma-orange flex items-center gap-1 transition opacity-80 hover:opacity-100">
                    En <ChevronDown size={10}/>
                  </button>
               </div>
               <a 
                 href="/?view=LOGIN"
                 onClick={(e) => handleNav(e, 'LOGIN')}
                 className="flex items-center gap-2 pl-4 text-gray-400 hover:text-white transition uppercase tracking-wider ml-2"
               >
                 <User size={12} /> Login
               </a>
            </div>
         </div>
      </div>

      {/* MAIN NAVBAR */}
      <nav className={`sticky top-0 z-[100] transition-all duration-500 ${
          isScrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border-b border-masuma-orange/10 py-2' 
          : 'bg-white border-b-4 border-masuma-orange py-4'
      }`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Section */}
            <a href="/" className="flex-shrink-0 cursor-pointer group transition-transform duration-500 hover:scale-105" onClick={(e) => handleNav(e, 'HOME')}>
              <Logo />
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10" role="navigation" aria-label="Main Navigation">
              {navItems.map((item) => (
                  <a 
                      key={item}
                      href={`/?view=${item}`}
                      onClick={(e) => handleNav(e, item)} 
                      className="relative text-masuma-dark font-bold uppercase tracking-wider text-sm hover:text-masuma-orange transition-all duration-300 group focus-ring p-1"
                      aria-label={`Navigate to ${formatNavLabel(item)}`}
                  >
                      {formatNavLabel(item)}
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-1 bg-masuma-orange transition-all duration-500 group-hover:w-full rounded-full"></span>
                  </a>
              ))}
            </div>

            {/* Right Side Icons */}
              <div className="flex items-center space-x-6">
                <button 
                  onClick={toggleAi}
                  className="hidden lg:flex items-center space-x-3 bg-masuma-dark hover:bg-masuma-orange text-white px-6 py-3 rounded-xl transition-all duration-500 group border border-transparent shadow-xl shadow-masuma-dark/10 hover:shadow-masuma-orange/20 active:scale-95 focus-ring"
                  aria-label="Open AI Assistant"
                >
                  <Bot size={18} className="group-hover:rotate-[20deg] transition-transform duration-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">Ask AI Expert</span>
                </button>

                <div className="relative cursor-pointer group touch-target focus-ring" onClick={toggleCart} aria-label={`View Cart with ${cartCount} items`} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleCart()}>
                  <div className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-500 group-hover:rotate-6">
                    <ShoppingCart className="text-masuma-dark group-hover:text-masuma-orange transition-colors duration-500" size={24} />
                  </div>
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 bg-masuma-orange text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg shadow-masuma-orange/40 transform scale-100 animate-bounce-subtle">
                      {cartCount}
                    </span>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className="text-masuma-dark p-2 hover:bg-gray-100 rounded-xl transition-colors touch-target"
                    aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
                    aria-expanded={isMenuOpen}
                  >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                  </button>
                </div>
              </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden bg-white absolute w-full border-t border-gray-100 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${
            isMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
            <div className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                  <a 
                      key={item}
                      href={`/?view=${item}`}
                      onClick={(e) => handleNav(e, item)} 
                      className="block w-full text-left px-4 py-4 text-sm font-bold text-masuma-dark hover:text-masuma-orange hover:bg-gray-50 border-b border-gray-100 uppercase tracking-wider"
                  >
                      {formatNavLabel(item)}
                  </a>
              ))}
              {/* Mobile Currency */}
              <div className="px-4 py-4 border-b border-gray-100 flex gap-2">
                  {currencies.map(c => (
                      <button key={c} onClick={() => setCurrency(c)} className={`text-xs border px-2 py-1 rounded ${currency === c ? 'bg-masuma-orange text-white border-masuma-orange' : 'bg-white text-gray-600'}`}>{c}</button>
                  ))}
              </div>
              
              {/* Mobile Special Order */}
               <button 
                  onClick={() => { setIsSourcingOpen(true); setIsMenuOpen(false); }} 
                  className="block w-full text-left px-4 py-4 text-sm font-bold text-masuma-orange hover:bg-gray-50 border-b border-gray-100 uppercase tracking-wider flex items-center gap-2"
              >
                  <Plane size={16} className="transform -rotate-45" /> Request Special Part
              </button>

              {/* Mobile Login */}
              <a 
                  href="/?view=LOGIN"
                  onClick={(e) => handleNav(e, 'LOGIN')} 
                  className="block w-full text-left px-4 py-4 text-sm font-bold text-gray-500 hover:text-masuma-dark hover:bg-gray-50 border-b border-gray-100 uppercase tracking-wider flex items-center gap-2"
              >
                  <User size={16} /> Staff Login
              </a>
              
              <button 
                  onClick={() => { toggleAi(); setIsMenuOpen(false); }} 
                  className="mt-6 block w-full text-center px-4 py-4 text-sm font-bold text-white bg-masuma-orange hover:bg-masuma-dark transition rounded-sm uppercase tracking-widest"
              >
                  Ask AI Assistant
              </button>
            </div>
        </div>
      </nav>

      <SourcingModal isOpen={isSourcingOpen} onClose={() => setIsSourcingOpen(false)} />
    </>
  );
};

export default Navbar;
