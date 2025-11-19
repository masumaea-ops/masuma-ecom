
import React, { useState } from 'react';
import { X, Check, AlertTriangle, Truck, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import QuoteModal from './QuoteModal';

interface QuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  addToCart: (product: Product) => void;
}

const QuickView: React.FC<QuickViewProps> = ({ product, isOpen, onClose, addToCart }) => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  if (!isOpen || !product) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
        
        <div className="relative bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-scale-up">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-gray-100 transition"
          >
            <X size={24} className="text-masuma-dark" />
          </button>

          {/* Image Section */}
          <div className="w-full md:w-1/2 bg-gray-50 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 relative">
              <img 
                src={product.image} 
                alt={product.name} 
                className="max-h-[300px] md:max-h-[400px] object-contain mix-blend-multiply" 
              />
              <div className="absolute bottom-4 left-4">
                 <span className="inline-block px-3 py-1 bg-white border border-gray-200 text-xs font-bold text-gray-500 rounded-full shadow-sm">
                   Category: {product.category}
                 </span>
              </div>
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/2 p-8 overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-masuma-dark font-display mb-2">{product.name}</h2>
              <div className="flex flex-wrap gap-2 items-center">
                  <span className="px-2 py-1 bg-masuma-orange text-white text-xs font-mono font-bold rounded-sm">SKU: {product.sku}</span>
                  {product.stock ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-bold uppercase">
                          <Check size={14} /> In Stock
                      </span>
                  ) : (
                      <span className="flex items-center gap-1 text-red-600 text-xs font-bold uppercase">
                          <AlertTriangle size={14} /> Out of Stock
                      </span>
                  )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Price</h3>
              <p className="text-3xl font-bold text-masuma-dark">
                  <span className="text-lg align-top mr-1">KES</span>{product.price.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Includes VAT. Delivery fees calculated at checkout.</p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>

            <div className="mb-6 bg-gray-50 p-4 rounded-sm border border-gray-100">
              <h3 className="text-xs font-bold text-masuma-dark uppercase tracking-wider mb-3">Technical Specs</h3>
              <div className="grid grid-cols-1 gap-y-3">
                  <div>
                      <span className="block text-[10px] text-gray-500 uppercase">OEM Cross-Reference</span>
                      <p className="text-sm font-mono text-gray-800">{product.oemNumbers.join(', ')}</p>
                  </div>
                  <div>
                      <span className="block text-[10px] text-gray-500 uppercase">Compatible Models</span>
                      <p className="text-sm text-gray-800">{product.compatibility.join(', ')}</p>
                  </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
              <button
                  onClick={() => { addToCart(product); onClose(); }}
                  disabled={!product.stock}
                  className={`flex-1 py-3 px-4 font-bold uppercase tracking-widest text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                      product.stock 
                      ? 'bg-masuma-dark text-white hover:bg-masuma-orange shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                  {product.stock ? 'Add to Cart' : 'Sold Out'}
              </button>
              
              <button
                  onClick={() => setIsQuoteModalOpen(true)}
                  className="flex-1 py-3 px-4 font-bold uppercase tracking-widest text-xs sm:text-sm transition flex items-center justify-center gap-2 bg-white border-2 border-masuma-dark text-masuma-dark hover:bg-masuma-dark hover:text-white"
              >
                  <MessageCircle size={18} />
                  Request Quote
              </button>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-gray-500 justify-center sm:justify-start">
                 <Truck size={16} />
                 <span className="text-[10px] uppercase font-bold">Fast delivery in Nairobi</span>
            </div>
          </div>
        </div>
      </div>

      <QuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        product={product} 
      />
    </>
  );
};

export default QuickView;
