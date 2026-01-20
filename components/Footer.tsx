import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { ViewState } from '../types';
import { Logo } from './Logo';

interface FooterProps {
    setView?: (view: ViewState) => void;
}

const Footer: React.FC<FooterProps> = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const [info, setInfo] = useState({
      about: 'Masuma Autoparts East Africa Limited. The official distributor of certified Masuma components. Engineering you can trust for the African road.',
      address: 'Ruby Mall, First Floor, Behind NCBA Bank, Accra Road, Nairobi',
      phone: '+254 792 506 590',
      email: 'sales@masuma.africa'
  });

  useEffect(() => {
      const fetchSettings = async () => {
          try {
              const res = await apiClient.get('/settings');
              const s = res.data;
              setInfo({
                  about: s.CMS_FOOTER_ABOUT || info.about,
                  address: s.CMS_CONTACT_ADDRESS || info.address,
                  phone: s.CMS_CONTACT_PHONE || info.phone,
                  email: s.CMS_CONTACT_EMAIL || info.email
              });
          } catch (e) {
              // Fail silently to defaults
          }
      };
      fetchSettings();
  }, []);

  const handleNav = (e: React.MouseEvent, view: ViewState) => {
      e.preventDefault();
      if (setView) {
          setView(view);
          const newUrl = `/?view=${view}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
          window.scrollTo(0, 0);
      }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedEmail = email.trim();
      if (!trimmedEmail) return;

      setStatus('loading');
      setMessage('');
      
      try {
          const res = await apiClient.post('/newsletter/subscribe', { email: trimmedEmail });
          setStatus('success');
          setMessage(res.data.message || 'Subscription confirmed!');
          setEmail('');
          // Clear success message after 8 seconds
          setTimeout(() => {
              setStatus('idle');
              setMessage('');
          }, 8000);
      } catch (err: any) {
          setStatus('error');
          // Try to extract specific Zod error if available
          const serverError = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Subscription failed.';
          setMessage(serverError);
          // Don't auto-clear error so user can read it
      }
  };

  return (
    <footer className="bg-masuma-dark text-white pt-16 pb-8 border-t-4 border-masuma-orange">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div>
            <div className="mb-4">
                <Logo variant="white" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {info.about}
            </p>
            <div className="flex space-x-3">
               <a href="#" className="bg-white/10 p-2 rounded-sm hover:bg-masuma-orange transition"><Facebook size={18} /></a>
               <a href="#" className="bg-white/10 p-2 rounded-sm hover:bg-masuma-orange transition"><Instagram size={18} /></a>
               <a href="#" className="bg-white/10 p-2 rounded-sm hover:bg-masuma-orange transition"><Twitter size={18} /></a>
             </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white font-display uppercase tracking-wide border-l-2 border-masuma-orange pl-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/?view=ABOUT" onClick={(e) => handleNav(e, 'ABOUT')} className="hover:text-masuma-orange transition">About Us</a></li>
              <li><a href="/?view=PART_FINDER" onClick={(e) => handleNav(e, 'PART_FINDER')} className="hover:text-masuma-orange transition">Search Parts</a></li>
              <li><a href="/?view=WARRANTY" onClick={(e) => handleNav(e, 'WARRANTY')} className="hover:text-masuma-orange transition">Warranty Policy</a></li>
              <li><a href="#" className="hover:text-masuma-orange transition">Distributor Portal</a></li>
              <li><a href="#" className="hover:text-masuma-orange transition">Download Catalog (PDF)</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white font-display uppercase tracking-wide border-l-2 border-masuma-orange pl-3">Contact Us</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-masuma-orange flex-shrink-0 mt-0.5" />
                <span>{info.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-masuma-orange flex-shrink-0" />
                <span>{info.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-masuma-orange flex-shrink-0" />
                <span>{info.email}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
             <h3 className="text-lg font-bold mb-4 text-white font-display uppercase tracking-wide border-l-2 border-masuma-orange pl-3">Stay Updated</h3>
             <p className="text-xs text-gray-400 mb-4">Subscribe for price alerts, new shipments, and Japanese maintenance tips.</p>
             
             {status === 'success' ? (
                 <div className="bg-green-600/20 border border-green-600/50 p-4 rounded text-xs text-green-400 flex items-center gap-3 animate-scale-up">
                     <CheckCircle size={20} className="shrink-0" />
                     <p className="font-bold">{message}</p>
                 </div>
             ) : (
                <form className="flex flex-col gap-2" onSubmit={handleSubscribe}>
                    <div className="relative group">
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email" 
                            disabled={status === 'loading'}
                            className={`bg-white/5 border ${status === 'error' ? 'border-red-500' : 'border-white/10 group-hover:border-masuma-orange/50'} text-white px-4 py-4 text-sm focus:outline-none focus:border-masuma-orange transition w-full outline-none`}
                        />
                        <Mail size={16} className={`absolute right-4 top-4 transition-colors ${status === 'error' ? 'text-red-500' : 'text-white/20'}`} />
                    </div>
                    
                    {status === 'error' && (
                        <div className="bg-red-500/10 border border-red-500/20 p-2 rounded flex items-center gap-2 animate-slide-up">
                            <AlertCircle size={12} className="text-red-500" />
                            <p className="text-[10px] text-red-500 font-bold uppercase">{message}</p>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={status === 'loading' || !email.trim()}
                        className="bg-masuma-orange text-white px-4 py-4 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-masuma-orange transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                    >
                        {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> Get Updates</>}
                    </button>
                    <p className="text-[9px] text-gray-500 text-center mt-1 uppercase font-bold opacity-50">Japanese Precision in your inbox</p>
                </form>
             )}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">&copy; {new Date().getFullYear()} Masuma Autoparts East Africa Limited. Licensed by Masuma Japan.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <a href="/?view=PRIVACY" onClick={(e) => handleNav(e, 'PRIVACY')} className="hover:text-white transition">Privacy Policy</a>
            <a href="/?view=TERMS" onClick={(e) => handleNav(e, 'TERMS')} className="hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;