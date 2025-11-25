import React, { useState } from 'react';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '../utils/apiClient';

interface AdminLoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', formData);
      const { token, user } = response.data;
      onLoginSuccess(user, token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-masuma-orange animate-scale-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-display text-masuma-dark">MASUMA ERP</h2>
          <p className="text-sm text-gray-500 uppercase tracking-widest">Staff Access Portal</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 border border-red-200 flex items-center gap-2">
            <Lock size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Email Address</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" 
              placeholder="admin@masuma.africa"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Password</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" 
              placeholder="••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-masuma-dark text-white py-3 font-bold uppercase hover:bg-masuma-orange transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />} 
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
        <div className="mt-6 text-center">
           <button onClick={onBack} className="text-sm text-gray-400 hover:text-masuma-dark underline flex items-center justify-center gap-1 mx-auto">
             <ArrowLeft size={14} /> Back to Storefront
           </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;