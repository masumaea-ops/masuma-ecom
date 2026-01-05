import React, { useState } from 'react';
import { Lock, Loader2, ArrowLeft, Mail, Send, CheckCircle } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { Logo } from './Logo';

interface AdminLoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [view, setView] = useState<'login' | 'forgot'>('login');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (view === 'login') {
          const response = await apiClient.post('/auth/login', formData);
          const { token, user } = response.data;
          onLoginSuccess(user, token);
      } else {
          await apiClient.post('/auth/forgot-password', { email: formData.email });
          setSuccess('Reset link sent! Please check your email inbox.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-masuma-orange animate-scale-up">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo />
          <p className="text-sm text-gray-500 uppercase tracking-widest mt-4">
              {view === 'login' ? 'Staff Access Portal' : 'Password Recovery'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 border border-red-200 flex items-center gap-2">
            <Lock size={16} /> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded text-sm mb-4 border border-green-200 flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Email Address</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none transition" 
              placeholder="admin@masuma.africa"
              required
            />
          </div>
          
          {view === 'login' && (
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Password</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none transition" 
                  placeholder="••••••"
                  required
                />
              </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-masuma-dark text-white py-3 font-bold uppercase hover:bg-masuma-orange transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : view === 'login' ? <Lock size={18} /> : <Send size={18} />} 
            {isLoading ? 'Processing...' : view === 'login' ? 'Secure Login' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4">
           {view === 'login' ? (
                <button onClick={() => setView('forgot')} className="text-xs font-bold text-gray-400 hover:text-masuma-orange uppercase tracking-wider">
                    Forgot Password?
                </button>
           ) : (
                <button onClick={() => setView('login')} className="text-xs font-bold text-gray-400 hover:text-masuma-dark uppercase tracking-wider flex items-center gap-1">
                    <ArrowLeft size={12} /> Back to Login
                </button>
           )}

           <button onClick={onBack} className="text-sm text-gray-400 hover:text-masuma-dark underline flex items-center justify-center gap-1">
             <ArrowLeft size={14} /> Back to Storefront
           </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;