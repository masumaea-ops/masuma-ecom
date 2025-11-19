
import React, { useState, useEffect } from 'react';
import { X, Smartphone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';

interface MpesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onSuccess: () => void;
}

const MpesaModal: React.FC<MpesaModalProps> = ({ isOpen, onClose, cartItems, onSuccess }) => {
  const [step, setStep] = useState<'input' | 'processing' | 'success' | 'error'>('input');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Polling Logic
  useEffect(() => {
    let interval: any;

    if (step === 'processing' && currentOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders/${currentOrderId}/status`);
          const data = await res.json();
          
          if (data.status === 'PAID') {
            setStep('success');
            clearInterval(interval);
            setTimeout(() => {
              onSuccess(); // Triggers app-level clear cart
              onClose();
            }, 3000);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => clearInterval(interval);
  }, [step, currentOrderId, onSuccess, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');

    try {
      const res = await fetch('/api/mpesa/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Payment failed');

      setCurrentOrderId(data.orderId);
      // Stay in 'processing' state to poll

    } catch (err: any) {
      setStep('error');
      setErrorMessage(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-scale-up font-sans">
        {/* Header */}
        <div className="bg-[#4CAF50] p-5 flex justify-between items-center border-b-4 border-[#1B5E20]">
           <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
             <Smartphone size={24} /> Lipa Na M-Pesa
           </h3>
           <button onClick={onClose} className="text-white/80 hover:text-white transition"><X size={24} /></button>
        </div>

        <div className="p-6">
          
          {/* STEP 1: INPUT */}
          {step === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-gray-50 p-4 border border-gray-200 rounded text-center mb-4">
                <p className="text-xs text-gray-500 uppercase font-bold">Total Amount</p>
                <p className="text-2xl font-bold text-masuma-dark">KES {totalAmount.toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-masuma-dark uppercase">Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-gray-300 rounded-sm focus:border-[#4CAF50] outline-none text-sm" placeholder="John Doe" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-masuma-dark uppercase">Email</label>
                 <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border border-gray-300 rounded-sm focus:border-[#4CAF50] outline-none text-sm" placeholder="john@example.com" />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-masuma-dark uppercase">M-Pesa Phone Number</label>
                 <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border border-gray-300 rounded-sm focus:border-[#4CAF50] outline-none text-sm" placeholder="07XX XXX XXX" />
                 <p className="text-[10px] text-gray-500">Enter the number you wish to pay with.</p>
              </div>

              <button type="submit" className="w-full bg-[#4CAF50] hover:bg-[#1B5E20] text-white font-bold uppercase tracking-widest py-4 rounded-sm transition shadow-lg mt-2">
                Pay Now
              </button>
            </form>
          )}

          {/* STEP 2: PROCESSING */}
          {step === 'processing' && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="relative w-20 h-20 mb-6">
                 <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-[#4CAF50] rounded-full border-t-transparent animate-spin"></div>
                 <Smartphone className="absolute inset-0 m-auto text-gray-400" size={32} />
              </div>
              <h4 className="text-xl font-bold text-masuma-dark mb-2">Check your Phone</h4>
              <p className="text-gray-600 text-sm max-w-xs mb-4">
                We've sent a prompt to <strong>{formData.phone}</strong>. Please enter your M-Pesa PIN to complete the transaction.
              </p>
              <p className="text-xs text-gray-400 animate-pulse">Waiting for confirmation...</p>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-scale-up">
                <CheckCircle size={40} />
              </div>
              <h4 className="text-xl font-bold text-masuma-dark mb-2">Payment Received!</h4>
              <p className="text-gray-600 text-sm">
                Your order has been confirmed. You will receive an email shortly.
              </p>
            </div>
          )}

          {/* STEP 4: ERROR */}
          {step === 'error' && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={40} />
              </div>
              <h4 className="text-xl font-bold text-masuma-dark mb-2">Payment Failed</h4>
              <p className="text-red-600 text-sm mb-6">{errorMessage}</p>
              <button onClick={() => setStep('input')} className="px-6 py-2 border-2 border-masuma-dark text-masuma-dark font-bold uppercase hover:bg-masuma-dark hover:text-white transition">
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MpesaModal;
