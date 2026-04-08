import React from 'react';
import { Home, Search, ShoppingCart, Bot, User } from 'lucide-react';
import { ViewState } from '../types';

interface MobileBottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  cartCount: number;
  toggleCart: () => void;
  toggleAi: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ 
  currentView, 
  setView, 
  cartCount, 
  toggleCart, 
  toggleAi 
}) => {
  const handleNav = (view: ViewState) => {
    setView(view);
    const newUrl = view === 'HOME' ? '/' : `/?view=${view}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    window.scrollTo(0, 0);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[100] pb-safe">
      <div className="flex justify-around items-center h-16">
        <button 
          onClick={() => handleNav('HOME')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors touch-target focus-ring ${currentView === 'HOME' ? 'text-masuma-orange' : 'text-gray-500'}`}
          aria-label="Home"
        >
          <Home size={22} />
          <span className="text-[10px] font-medium uppercase tracking-tight font-display">Home</span>
        </button>
        
        <button 
          onClick={() => handleNav('CATALOG')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors touch-target focus-ring ${currentView === 'CATALOG' ? 'text-masuma-orange' : 'text-gray-500'}`}
          aria-label="Catalog"
        >
          <Search size={22} />
          <span className="text-[10px] font-medium uppercase tracking-tight font-display">Search</span>
        </button>

        <button 
          onClick={toggleAi}
          className="flex flex-col items-center justify-center w-full h-full -mt-8 touch-target focus-ring"
          aria-label="AI Assistant"
        >
          <div className="bg-masuma-dark text-white p-3.5 rounded-full shadow-lg border-4 border-white active:scale-95 transition-transform">
            <Bot size={26} />
          </div>
          <span className="text-[10px] font-medium uppercase tracking-tight mt-1 text-masuma-dark font-display">Expert</span>
        </button>

        <button 
          onClick={toggleCart}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 relative touch-target focus-ring"
          aria-label="Cart"
        >
          <div className="relative">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-masuma-orange text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium uppercase tracking-tight font-display">Cart</span>
        </button>

        <button 
          onClick={() => handleNav('LOGIN')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors touch-target focus-ring ${currentView === 'LOGIN' ? 'text-masuma-orange' : 'text-gray-500'}`}
          aria-label="Account"
        >
          <User size={22} />
          <span className="text-[10px] font-medium uppercase tracking-tight font-display">Account</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
