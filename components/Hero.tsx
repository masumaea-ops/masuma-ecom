
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShieldCheck, TrendingUp, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
import { ViewState, HeroSlide } from '../types';
import { apiClient } from '../utils/apiClient';

interface HeroProps {
    setView: (view: ViewState) => void;
}

const DEFAULT_SLIDES: HeroSlide[] = [
    {
        id: 'default-1',
        title: 'JAPANESE\nPRECISION.\nKENYAN GRIT.',
        subtitle: 'Upgrade your ride with parts engineered to survive Nairobi\'s toughest roads.',
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
        ctaText: 'Browse Catalog',
        ctaLink: 'CATALOG'
    }
];

const Hero: React.FC<HeroProps> = ({ setView }) => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const [announcementColor, setAnnouncementColor] = useState('#E0621B');
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
      const fetchSettings = async () => {
          try {
              const res = await apiClient.get('/settings');
              const s = res.data;
              
              if (s) {
                  // 1. Load Slides
                  if (s.CMS_HERO_SLIDES) {
                      try {
                          const parsed = JSON.parse(s.CMS_HERO_SLIDES);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                              setSlides(parsed);
                          } else {
                              setSlides(DEFAULT_SLIDES);
                          }
                      } catch (e) { 
                          setSlides(DEFAULT_SLIDES);
                      }
                  } else {
                      setSlides(DEFAULT_SLIDES);
                  }

                  // 2. Load Announcement
                  if (s.CMS_ANNOUNCEMENT_ENABLED === 'true') {
                      setAnnouncement(s.CMS_ANNOUNCEMENT_TEXT || '');
                      setAnnouncementColor(s.CMS_ANNOUNCEMENT_COLOR || '#E0621B');
                  }
              } else {
                  setSlides(DEFAULT_SLIDES);
              }
          } catch (error) {
              // Silent fail to default slides on network error to prevent console spam
              setSlides(DEFAULT_SLIDES);
          }
      };
      fetchSettings();
  }, []);

  // Auto-Advance Logic
  const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
      resetTimeout();
      if (slides.length > 1) {
        timeoutRef.current = setTimeout(() => {
            setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 8000); 
      }
      return () => resetTimeout();
  }, [currentSlide, slides]);

  const nextSlide = () => {
      setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
      setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const getYoutubeId = (url: string) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYoutubeEmbedUrl = (url: string) => {
      const id = getYoutubeId(url);
      if (!id) return '';
      // Fix for Error 153: Pass origin to allow embedding on restricted domains
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&showinfo=0&enablejsapi=1&origin=${origin}`;
  };

  if (slides.length === 0) {
      // Immediate fallback if loading state persists too long or init fails
      return (
        <div className="h-[600px] md:h-[700px] bg-masuma-dark animate-pulse flex items-center justify-center">
            <div className="text-gray-600 font-bold uppercase tracking-widest">Loading...</div>
        </div>
      );
  }

  return (
    <>
    {announcement && (
        <div style={{ backgroundColor: announcementColor }} className="text-white text-center text-xs font-bold py-2 uppercase tracking-wider relative z-20">
            {announcement}
        </div>
    )}
    <div className="relative bg-masuma-dark overflow-hidden h-[600px] md:h-[700px] 2xl:h-[850px] group">
      
      {slides.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
             {/* MEDIA BACKGROUND */}
             <div className="absolute inset-0 bg-black">
                 {slide.mediaType === 'youtube' && slide.videoUrl ? (
                     <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <iframe 
                            src={getYoutubeEmbedUrl(slide.videoUrl)} 
                            className="w-[300%] h-[300%] -ml-[100%] -mt-[100%] md:w-full md:h-full md:ml-0 md:mt-0 object-cover opacity-60"
                            allow="autoplay; encrypted-media"
                            title="Background Video"
                        ></iframe>
                     </div>
                 ) : slide.mediaType === 'video' && slide.videoUrl ? (
                     <video 
                        src={slide.videoUrl} 
                        autoPlay 
                        muted 
                        loop 
                        className="absolute inset-0 w-full h-full object-cover opacity-70"
                     ></video>
                 ) : (
                     <div 
                        className="absolute inset-0 bg-cover bg-center mix-blend-normal transition-transform duration-[10000ms] ease-linear opacity-60"
                        style={{ 
                            backgroundImage: `url('${slide.image}')`,
                            transform: index === currentSlide ? 'scale(1.05)' : 'scale(1)'
                        }}
                     ></div>
                 )}
             </div>
             
             {/* Gradient Overlay */}
             <div className="absolute inset-0 bg-gradient-to-r from-masuma-dark via-masuma-dark/70 to-transparent"></div>

             {/* Content */}
             <div className="absolute inset-0 flex items-center">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className={`lg:w-2/3 transform transition-all duration-1000 delay-300 ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                        
                        <div className="inline-flex items-center gap-2 bg-masuma-orange/20 border border-masuma-orange text-white text-[10px] font-bold px-3 py-1 mb-6 uppercase tracking-[0.2em] backdrop-blur-sm">
                            <span className="w-2 h-2 bg-masuma-orange rounded-full animate-pulse"></span>
                            Official Distributor for East Africa
                        </div>
                        
                        <h1 
                            className="text-5xl md:text-7xl 2xl:text-8xl font-bold text-white leading-[0.9] mb-8 font-display whitespace-pre-line drop-shadow-lg"
                            dangerouslySetInnerHTML={{ 
                                __html: slide.title.replace(/\\n/g, '\n').replace(/KENYAN GRIT\./, '<span class="text-transparent bg-clip-text bg-gradient-to-r from-masuma-orange to-orange-400">KENYAN GRIT.</span>') 
                            }}
                        />
                        
                        <p className="text-lg md:text-xl 2xl:text-2xl text-gray-300 mb-10 max-w-xl 2xl:max-w-3xl font-light leading-relaxed drop-shadow-md">
                            {slide.subtitle}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-5">
                            <button 
                                onClick={() => setView(slide.ctaLink as any || 'CATALOG')}
                                className="bg-masuma-orange hover:bg-white hover:text-masuma-orange text-white font-bold py-4 px-10 2xl:px-12 2xl:py-5 rounded-none flex items-center justify-center transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 uppercase tracking-wider text-sm 2xl:text-base"
                            >
                                {slide.ctaText || 'Learn More'} <ArrowRight className="ml-3" size={18} />
                            </button>
                            <button 
                                onClick={() => setView('CONTACT')}
                                className="bg-transparent border-2 border-white/30 text-white hover:bg-white hover:text-masuma-dark hover:border-white font-bold py-4 px-10 2xl:px-12 2xl:py-5 rounded-none flex items-center justify-center transition duration-300 uppercase tracking-wider text-sm 2xl:text-base backdrop-blur-sm"
                            >
                                Become a Dealer
                            </button>
                        </div>
                    </div>
                </div>
             </div>
          </div>
      ))}

      {slides.length > 1 && (
          <>
            <div className="absolute bottom-32 right-0 md:right-20 flex gap-2 z-20 px-4">
                {slides.map((_, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-masuma-orange w-8' : 'bg-white/30 hover:bg-white/60'}`}
                    ></button>
                ))}
            </div>

            <button 
                onClick={prevSlide}
                className="absolute top-1/2 left-4 z-20 p-3 rounded-full bg-white/10 hover:bg-masuma-orange text-white backdrop-blur-sm transition transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft size={24} />
            </button>

            <button 
                onClick={nextSlide}
                className="absolute top-1/2 right-4 z-20 p-3 rounded-full bg-white/10 hover:bg-masuma-orange text-white backdrop-blur-sm transition transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
            >
                <ChevronRight size={24} />
            </button>
          </>
      )}

      {/* Features Banner */}
      <div className="absolute bottom-0 left-0 right-0 z-20 hidden md:block">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-2xl grid grid-cols-3 divide-x divide-gray-100 border-b-4 border-masuma-orange">
                {[
                    { icon: ShieldCheck, title: "12 Month Warranty", desc: "On all suspension parts" },
                    { icon: Wrench, title: "Mechanic Approved", desc: "Used by top Nairobi garages" },
                    { icon: TrendingUp, title: "Longer Lifespan", desc: "Outlasts standard aftermarket" }
                ].map((feature, idx) => (
                    <div key={idx} className="p-6 flex items-center space-x-4 hover:bg-gray-50 transition group cursor-default">
                        <div className="p-3 bg-gray-100 text-masuma-dark group-hover:bg-masuma-orange group-hover:text-white transition duration-300 rounded-full">
                            <feature.icon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-masuma-dark font-display uppercase tracking-wide">{feature.title}</h3>
                            <p className="text-[10px] text-gray-500 mt-1">{feature.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      </div>
    </div>
    </>
  );
};

export default Hero;
