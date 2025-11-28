
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter, ArrowRight } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { ViewState } from '../types';

interface FooterProps {
    setView?: (view: ViewState) => void;
}

const Footer: React.FC<FooterProps> = ({ setView }) => {
  const [info, setInfo] = useState({
      about: 'Masuma Autoparts East Africa Limited. The official distributor of certified Masuma components. Engineering you can trust for the African road.',
      address: 'Ruby Mall, Shop FF25 First Floor Behind NCBA Bank Accra Road',
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

  return (
    <footer className="bg-masuma-dark text-white pt-16 pb-8 border-t-4 border-masuma-orange">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div>
            <div className="flex flex-col mb-4">
              <span className="text-3xl font-bold text-masuma-orange tracking-tighter font-display">MASUMA</span>
              <span className="text-[0.65rem] font-bold text-white tracking-widest uppercase leading-none">Autoparts East Africa Ltd</span>
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
            <h3 className="text-lg font-bold mb-4 text-white font-display uppercase tracking-wide">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => setView?.('PART_FINDER')} className="hover:text-masuma-orange transition">Search Parts</button></li>
              <li><button onClick={() => setView?.('WARRANTY')} className="hover:text-masuma-orange transition">Warranty Policy</button></li>
              <li><a href="#" className="hover:text-masuma-orange transition">Distributor Portal</a></li>
              <li><a href="#" className="hover:text-masuma-orange transition">Download Catalog (PDF)</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white font-display uppercase tracking-wide">Contact Us</h3>
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
             <h3 className="text-lg font-bold mb-4 text-white font-display uppercase tracking-wide">Stay Updated</h3>
             <p className="text-xs text-gray-400 mb-4">Subscribe for price alerts, new shipments, and maintenance tips.</p>
             <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
               <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-masuma-orange transition w-full"
               />
               <button className="bg-masuma-orange text-white px-4 py-3 text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-masuma-orange transition flex items-center justify-center gap-2">
                 Subscribe <ArrowRight size={16} />
               </button>
             </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Masuma Autoparts East Africa Limited. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-xs text-gray-500">
            <a href="#" className="hover:text-white">Privacy Policy</a>
            <a href="#" className="hover:text-white">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
