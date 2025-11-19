
import React, { useState } from 'react';
import { X, Send, CheckCircle, Loader2, MessageSquare } from 'lucide-react';
import { Product } from '../types';
import { apiClient } from '../utils/apiClient';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose, product }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      await apiClient.post('/quotes', {
        ...formData,
        productId: product.id,
        productName: product.name
      });

      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Quote submission failed:', error);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-scale-up font-sans">
        
        {/* Header */}
        <div className="bg-masuma-dark p-5 flex justify-between items-center border-b-4 border-masuma-orange">
          <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
            <MessageSquare size={20} className="text-masuma-orange" />
            Request a Quote
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} />
              </div>
              <h4 className="text-xl font-bold text-masuma-dark mb-2">Request Sent!</h4>
              <p className="text-gray-600 text-sm">
                Our sales team at Industrial Area has received your request for the <strong>{product.name}</strong>. We will contact you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-4">
                <p className="text-xs text-gray-500 uppercase font-bold">Part Details</p>
                <p className="text-sm font-bold text-masuma-dark">{product.name}</p>
                <p className="text-xs text-gray-500 font-mono">SKU: {product.sku}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-masuma-dark uppercase">Full Name</label>
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-sm focus:border-masuma-orange outline-none text-sm transition"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-masuma-dark uppercase">Phone</label>
                  <input 
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-sm focus:border-masuma-orange outline-none text-sm transition"
                    placeholder="07XX XXX XXX"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-masuma-dark uppercase">Email</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-sm focus:border-masuma-orange outline-none text-sm transition"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-masuma-dark uppercase">Message / Specific Request</label>
                <textarea 
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-sm focus:border-masuma-orange outline-none text-sm transition h-24 resize-none"
                  placeholder="e.g., Do you have this in stock for immediate pickup? Can I get a bulk discount?"
                ></textarea>
              </div>

              {status === 'error' && (
                <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded">
                  Failed to send request. Please check your connection and try again.
                </p>
              )}

              <button 
                type="submit" 
                disabled={status === 'submitting'}
                className="w-full bg-masuma-dark text-white font-bold uppercase tracking-widest py-3 rounded-sm hover:bg-masuma-orange transition duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Send Request
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;
