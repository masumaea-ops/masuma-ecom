
import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, TrendingUp, Wrench } from 'lucide-react';
import { ViewState } from '../types';
import { apiClient } from '../utils/apiClient';

interface HeroProps {
    setView: (view: ViewState) => void;
}

const Hero: React.FC<HeroProps> = ({ setView }) => {
  const [content, setContent] = useState({
    title: 'JAPANESE\nPRECISION.\nKENYAN GRIT.',
    subtitle: 'Upgrade your ride with parts engineered to survive Nairobi\'s toughest roads. From suspension to filtration, choose the brand trusted by mechanics worldwide.',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
    announcement: '',
    announcementColor: '#E0621B'
  });

  useEffect(() => {
      const fetchSettings = async () => {
          try {
              const res = await apiClient.get('/settings');
              const s = res.data;
              
              if (s.CMS_HERO_TITLE) {
                  setContent({
                      title: s.CMS_HERO_TITLE.replace(/\\n/g, '\n'),
                      subtitle: s.CMS_HERO_SUBTITLE,
                      image: s.CMS_HERO_IMAGE,
                      announcement: s.CMS_ANNOUNCEMENT_ENABLED === 'true' ? s.CMS_ANNOUNCEMENT_TEXT : '',
                      announcementColor: s.CMS_ANNOUNCEMENT_COLOR || '#E0621B'
                  });
              }
          } catch (error) {
              // Silently fail to defaults
          }
      };
      fetchSettings();
  }, []);

  return (
    <>
    {content.announcement && (
        <div style={{ backgroundColor: content.announcementColor }} className="text-white text-center text-xs font-bold py-2 uppercase tracking-wider">
            {content.announcement}
        </div>
    )}
    <div className="relative bg-masuma-dark overflow-hidden">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 opacity-40 bg-cover bg-center mix-blend-luminosity transition-all duration-1000"
        style={{ backgroundImage: `url('${content.image}')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-r from-masuma-dark via-masuma-dark/90 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative py-24 md:py-40">
        <div className="lg:w-2/3 animate-slide-right">
          <div className="inline-flex items-center gap-2 bg-masuma-orange/20 border border-masuma-orange text-white text-[10px] font-bold px-3 py-1 mb-6 uppercase tracking-[0.2em] backdrop-blur-sm">
            <span className="w-2 h-2 bg-masuma-orange rounded-full animate-pulse"></span>
            Official Distributor for East Africa
          </div>
          <h1 
            className="text-5xl md:text-7xl font-bold text-white leading-[0.9] mb-8 font-display whitespace-pre-line"
            dangerouslySetInnerHTML={{ 
                __html: content.title.replace(/KENYAN GRIT\./, '<span class="text-transparent bg-clip-text bg-gradient-to-r from-masuma-orange to-orange-400">KENYAN GRIT.</span>') 
            }}
          />
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl font-light leading-relaxed">
            {content.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-5">
            <button 
              onClick={() => setView('CATALOG')}
              className="bg-masuma-orange hover:bg-white hover:text-masuma-orange text-white font-bold py-4 px-10 rounded-none flex items-center justify-center transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 uppercase tracking-wider text-sm"
            >
              Browse Catalog <ArrowRight className="ml-3" size={18} />
            </button>
            <button 
              onClick={() => setView('CONTACT')}
              className="bg-transparent border-2 border-white/30 text-white hover:bg-white hover:text-masuma-dark hover:border-white font-bold py-4 px-10 rounded-none flex items-center justify-center transition duration-300 uppercase tracking-wider text-sm backdrop-blur-sm"
            >
              Become a Dealer
            </button>
          </div>
        </div>
      </div>

      {/* Floating Features Banner */}
      <div className="relative z-20 mt-0 md:-mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-2xl grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-b-4 border-masuma-orange">
            {[
                { icon: ShieldCheck, title: "12 Month Warranty", desc: "On all suspension parts" },
                { icon: Wrench, title: "Mechanic Approved", desc: "Used by top Nairobi garages" },
                { icon: TrendingUp, title: "Longer Lifespan", desc: "Outlasts standard aftermarket" }
            ].map((feature, idx) => (
                <div key={idx} className="p-8 flex items-center space-x-4 hover:bg-gray-50 transition group cursor-default">
                    <div className="p-3 bg-gray-100 text-masuma-dark group-hover:bg-masuma-orange group-hover:text-white transition duration-300 rounded-full">
                        <feature.icon size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-masuma-dark font-display uppercase tracking-wide">{feature.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default Hero;
