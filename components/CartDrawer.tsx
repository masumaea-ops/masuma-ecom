import React from 'react';
import { X, Trash2, CreditCard } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  removeFromCart: (id: string) => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, cartItems, removeFromCart, onCheckout }) => {
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="p-5 border-b-4 border-masuma-orange flex justify-between items-center bg-masuma-dark text-white">
            <h2 className="text-xl font-bold font-display uppercase tracking-wider">Your Cart</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              <X size={24} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p>Your cart is empty.</p>
                <button onClick={onClose} className="mt-4 text-masuma-orange font-bold text-sm hover:underline uppercase">Browse Catalog</button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 bg-white p-3 shadow-sm border border-gray-100">
                  <div className="h-16 w-16 bg-gray-100 overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-masuma-dark line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-gray-500 mb-1">SKU: {item.sku}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-masuma-orange font-bold text-sm">KES {item.price.toLocaleString()}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">x{item.quantity}</span>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium uppercase text-xs">Subtotal</span>
              <span className="text-xl font-bold text-masuma-dark">KES {total.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-gray-500 mb-4 text-center">
              Shipping via G4S or Wells Fargo available countrywide. Free delivery within Nairobi Industrial Area.
            </p>
            <button 
              onClick={onCheckout}
              disabled={cartItems.length === 0}
              className="w-full bg-masuma-orange hover:bg-masuma-dark text-white font-bold py-3 rounded-none flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
            >
              <CreditCard size={18} />
              Checkout
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default CartDrawer;