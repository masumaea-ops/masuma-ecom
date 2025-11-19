
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-[100] animate-slide-up">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-sm shadow-2xl border-l-4 ${
        type === 'success' 
          ? 'bg-masuma-dark text-white border-masuma-orange' 
          : 'bg-white text-red-600 border-red-600'
      }`}>
        {type === 'success' ? <CheckCircle size={20} className="text-masuma-orange" /> : <XCircle size={20} />}
        <span className="font-bold text-sm tracking-wide">{message}</span>
        <button onClick={onClose} className="ml-4 text-gray-400 hover:text-white transition">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
