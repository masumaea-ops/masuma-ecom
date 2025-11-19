
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, Search, Bot } from 'lucide-react';
import { ViewState } from '../types';

interface NavbarProps {
  cartCount: number;
  setView: (view: ViewState) => void;
  toggleCart: () => void;
  toggleAi: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, setView, toggleCart, toggleAi }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: ViewState[] = ['HOME', 'CATALOG', 'BLOG', 'ABOUT', 'CONTACT'];

  return (
    <nav className={`sticky top-0 z-[100] transition-all duration-300 ${
        isScrolled 
        ? 'bg-white shadow-lg border-b border-masuma-orange/20 py-2' 
        : 'bg-white border-b-4 border-masuma-orange py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    {item}
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
          isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
                <button 
                    key={item}
                    onClick={() => { setView(item); setIsMenuOpen(false); }} 
                    className="block w-full text-left px-4 py-4 text-sm font-bold text-masuma-dark hover:text-masuma-orange hover:bg-gray-50 border-b border-gray-100 uppercase tracking-wider"
                >
                    {item}
                </button>
            ))}
            <button 
                onClick={() => { toggleAi(); setIsMenuOpen(false); }} 
                className="mt-6 block w-full text-center px-4 py-4 text-sm font-bold text-white bg-masuma-orange hover:bg-masuma-dark transition rounded-sm uppercase tracking-widest"
            >
                Ask AI Assistant
            </button>
          </div>
      </div>
    </nav>
  );
};

export default Navbar;
