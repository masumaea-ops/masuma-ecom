import React, { useState } from 'react';
import { Lock, Loader2, ArrowLeft, Mail, Send, CheckCircle, Building, User, Phone, MapPin } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { Logo } from './Logo';
import SEO from './SEO';

interface AdminLoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBack }) => {
  const [view, setView] = useState<'login' | 'forgot' | 'register'>('login');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    fullName: '',
    businessName: '',
    taxId: '',
    phone: '',
    address: ''
  });
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
          const response = await apiClient.post('/auth/login', {
            email: formData.email,
            password: formData.password
          });
          const { token, user } = response.data;
          onLoginSuccess(user, token);
      } else if (view === 'forgot') {
          await apiClient.post('/auth/forgot-password', { email: formData.email });
          setSuccess('Reset link sent! Please check your email inbox.');
      } else {
          // Register B2B
          await apiClient.post('/auth/register-b2b', {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            businessName: formData.businessName,
            taxId: formData.taxId,
            phone: formData.phone,
            address: formData.address
          });
          setSuccess('Registration submitted! Our team will review your application and notify you via email.');
          setView('login');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <SEO 
        title="Admin Login" 
        description="Secure login for Masuma ERP administrators." 
        noindex={true}
      />
      <div className={`bg-white p-8 rounded-lg shadow-xl w-full ${view === 'register' ? 'max-w-2xl' : 'max-w-md'} border-t-4 border-masuma-orange transition-all duration-500 animate-scale-up`}>
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo />
          <p className="text-sm text-gray-500 uppercase tracking-widest mt-4">
              {view === 'login' ? 'Staff & Distributor Access' : view === 'forgot' ? 'Password Recovery' : 'Distributor Registration'}
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
          {view === 'register' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <h3 className="text-xs font-black uppercase text-masuma-orange mb-4 border-b pb-2">Business Information</h3>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Business Name *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded focus:border-masuma-orange outline-none transition text-sm" 
                    placeholder="e.g. Masuma Garage Ltd"
                  />
                  <Building size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Tax ID / KRA PIN</label>
                <input 
                  type="text" 
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none transition text-sm" 
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Business Phone *</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded focus:border-masuma-orange outline-none transition text-sm" 
                    placeholder="+254..."
                  />
                  <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Physical Address *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded focus:border-masuma-orange outline-none transition text-sm" 
                    placeholder="City, Street, Building"
                  />
                  <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-xs font-black uppercase text-masuma-orange mb-4 border-b pb-2">Contact Person & Credentials</h3>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Full Name *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded focus:border-masuma-orange outline-none transition text-sm" 
                    placeholder="John Doe"
                  />
                  <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Email Address *</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded focus:border-masuma-orange outline-none transition text-sm" 
                    placeholder="john@business.com"
                  />
                  <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Account Password *</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded focus:border-masuma-orange outline-none transition text-sm" 
                    placeholder="••••••••"
                  />
                  <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
                </div>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-masuma-dark text-white py-3 font-bold uppercase hover:bg-masuma-orange transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : view === 'login' ? <Lock size={18} /> : view === 'forgot' ? <Send size={18} /> : <CheckCircle size={18} />} 
            {isLoading ? 'Processing...' : view === 'login' ? 'Secure Login' : view === 'forgot' ? 'Send Reset Link' : 'Submit Application'}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4">
           <div className="flex gap-4">
              {view === 'login' ? (
                  <>
                    <button onClick={() => setView('forgot')} className="text-[10px] font-bold text-gray-400 hover:text-masuma-orange uppercase tracking-wider">
                        Forgot Password?
                    </button>
                    <span className="text-gray-200">|</span>
                    <button onClick={() => setView('register')} className="text-[10px] font-bold text-masuma-orange hover:underline uppercase tracking-wider">
                        Register Business
                    </button>
                  </>
              ) : (
                  <button onClick={() => setView('login')} className="text-xs font-bold text-gray-400 hover:text-masuma-dark uppercase tracking-wider flex items-center gap-1">
                      <ArrowLeft size={12} /> Back to Login
                  </button>
              )}
           </div>

           <button onClick={onBack} className="text-sm text-gray-400 hover:text-masuma-dark underline flex items-center justify-center gap-1">
             <ArrowLeft size={14} /> Back to Storefront
           </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;