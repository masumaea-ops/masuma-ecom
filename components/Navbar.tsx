
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Bot, Phone, MessageCircle, MapPin, User, ChevronDown, Plane } from 'lucide-react';
import { ViewState } from '../types';
import { useCurrency, CurrencyCode } from '../contexts/CurrencyContext';
import { apiClient } from '../utils/apiClient';
import SourcingModal from './SourcingModal';

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

  return (
    <>
      {/* TOP UTILITY BAR */}
      <div className="bg-masuma-dark text-white text-[10px] md:text-xs font-medium py-2.5 border-b border-gray-800 hidden md:block transition-colors relative z-[102]">
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
               <button onClick={() => setView('CONTACT')} className="flex items-center gap-2 px-4 opacity-80 hover:opacity-100 transition hover:text-masuma-orange">
                 <MapPin size={12} /> Locations
               </button>
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
               <button 
                 onClick={() => setView('LOGIN')}
                 className="flex items-center gap-2 pl-4 text-gray-400 hover:text-white transition uppercase tracking-wider ml-2"
               >
                 <User size={12} /> Login
               </button>
            </div>
         </div>
      </div>

      {/* MAIN NAVBAR */}
      <nav className={`sticky top-0 z-[100] transition-all duration-300 ${
          isScrolled 
          ? 'bg-white shadow-lg border-b border-masuma-orange/20 py-2' 
          : 'bg-white border-b-4 border-masuma-orange py-4'
      }`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Section */}
            <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => setView('HOME')}>
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-masuma-orange tracking-tighter font-display leading-none group-hover:scale-105 transition-transform origin-left">MASUMA</span>
                <span className="text-[0.65rem] font-bold text-masuma-dark tracking-[0.2em] uppercase leading-none mt-1">Autoparts E.A.</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                  <button 
                      key={item}
                      onClick={() => setView(item)} 
                      className="relative text-masuma-dark font-bold uppercase tracking-wide text-xs hover:text-masuma-orange transition group"
                  >
                      {formatNavLabel(item)}
                      <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-masuma-orange transition-all duration-300 group-hover:w-full"></span>
                  </button>
              ))}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-6">
              <button 
                onClick={toggleAi}
                className="hidden md:flex items-center space-x-2 bg-gray-100 hover:bg-masuma-orange hover:text-white text-masuma-dark px-4 py-2 rounded-full transition duration-300 group border border-gray-200"
              >
                <Bot size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wide">Ask AI</span>
              </button>

              <div className="relative cursor-pointer group" onClick={toggleCart}>
                <div className="p-2 rounded-full hover:bg-gray-100 transition duration-300">
                  <ShoppingCart className="text-masuma-dark group-hover:text-masuma-orange transition" size={24} />
                </div>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-masuma-orange text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md transform scale-100 animate-pulse-once">
                    {cartCount}
                  </span>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-masuma-dark p-2">
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
                  <button 
                      key={item}
                      onClick={() => { setView(item); setIsMenuOpen(false); }} 
                      className="block w-full text-left px-4 py-4 text-sm font-bold text-masuma-dark hover:text-masuma-orange hover:bg-gray-50 border-b border-gray-100 uppercase tracking-wider"
                  >
                      {formatNavLabel(item)}
                  </button>
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
              <button 
                  onClick={() => { setView('LOGIN'); setIsMenuOpen(false); }} 
                  className="block w-full text-left px-4 py-4 text-sm font-bold text-gray-500 hover:text-masuma-dark hover:bg-gray-50 border-b border-gray-100 uppercase tracking-wider flex items-center gap-2"
              >
                  <User size={16} /> Staff Login
              </button>
              
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
