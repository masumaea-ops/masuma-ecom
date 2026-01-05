
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShieldCheck, TrendingUp, Wrench, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ViewState, HeroSlide } from '../types';
import { apiClient } from '../utils/apiClient';

interface HeroProps {
    setView: (view: ViewState) => void;
}

const DEFAULT_SLIDES: HeroSlide[] = [
    {
        id: 'default-1',
        title: 'JAPANESE PRECISION.\nKENYAN STRENGTH.',
        subtitle: 'The official home of genuine Masuma components in Nairobi. Engineered in Tokyo to dominate the toughest roads in East Africa.',
        image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
        ctaText: 'View Local Inventory',
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

                  if (s.CMS_ANNOUNCEMENT_ENABLED === 'true') {
                      setAnnouncement(s.CMS_ANNOUNCEMENT_TEXT || '');
                      setAnnouncementColor(s.CMS_ANNOUNCEMENT_COLOR || '#E0621B');
                  }
              } else {
                  setSlides(DEFAULT_SLIDES);
              }
          } catch (error) {
              setSlides(DEFAULT_SLIDES);
          }
      };
      fetchSettings();
  }, []);

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

  const getYoutubeEmbedUrl = (url: string) => {
      if (!url) return '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : null;
      if (!id) return '';
      
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&enablejsapi=1&widgetid=1&origin=${encodeURIComponent(origin)}`;
  };

  if (slides.length === 0) {
      return (
        <div className="h-[600px] bg-masuma-dark flex items-center justify-center">
            <Loader2 className="animate-spin text-masuma-orange" size={48} />
        </div>
      );
  }

  return (
    <>
    {announcement && (
        <div style={{ backgroundColor: announcementColor }} className="text-white text-center text-[10px] font-black py-2.5 uppercase tracking-[0.2em] relative z-20 shadow-md">
            {announcement}
        </div>
    )}
    <div className="relative bg-masuma-dark overflow-hidden h-[600px] md:h-[750px] group">
      
      {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div 
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
               <div className="absolute inset-0 bg-black">
                   {slide.mediaType === 'youtube' && slide.videoUrl ? (
                       isActive ? (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <iframe 
                                src={getYoutubeEmbedUrl(slide.videoUrl)} 
                                className="w-full h-full object-cover opacity-90 scale-150"
                                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                frameBorder="0"
                                title="Background Video"
                            ></iframe>
                        </div>
                       ) : null
                   ) : (
                       <div 
                          className="absolute inset-0 bg-cover bg-center opacity-85"
                          style={{ backgroundImage: `url('${slide.image}')` }}
                       ></div>
                   )}
               </div>
               
               <div className="absolute inset-0 bg-gradient-to-r from-masuma-dark via-masuma-dark/40 to-transparent"></div>

               <div className="absolute inset-0 flex items-center">
                  <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                      <div className="max-w-3xl">
                          <div className="inline-flex items-center gap-3 bg-white/10 border-l-4 border-masuma-orange text-white text-[10px] font-bold px-4 py-2 mb-8 uppercase tracking-[0.3em] backdrop-blur-md">
                              <span className="w-2 h-2 bg-masuma-orange rounded-full animate-pulse"></span>
                              <span>Authentic Masuma Limited</span>
                          </div>
                          
                          <h1 
                            className="text-5xl md:text-8xl font-bold text-white mb-6 font-display uppercase tracking-tighter whitespace-pre-line leading-[0.85]"
                            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                          >
                              {slide.title}
                          </h1>
                          
                          <p 
                            className="text-lg md:text-xl text-gray-200 mb-10 max-w-xl font-medium leading-relaxed drop-shadow-md border-l border-white/20 pl-6"
                          >
                              {slide.subtitle}
                          </p>
                          
                          <div className="flex flex-wrap gap-4">
                              <button 
                                  onClick={() => setView(slide.ctaLink)}
                                  className="bg-masuma-orange hover:bg-white hover:text-masuma-orange text-white font-bold px-12 py-5 rounded-none transition duration-300 uppercase tracking-[0.2em] text-xs flex items-center gap-3 shadow-2xl group/btn"
                              >
                                  {slide.ctaText} <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                              </button>
                              
                              <div className="flex items-center gap-8 text-white ml-0 md:ml-6 drop-shadow-md opacity-80">
                                  <div className="flex flex-col items-center">
                                      <ShieldCheck size={28} className="text-masuma-orange mb-1" />
                                      <span className="text-[9px] uppercase font-black tracking-widest">1Yr Warranty</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                      <TrendingUp size={28} className="text-masuma-orange mb-1" />
                                      <span className="text-[9px] uppercase font-black tracking-widest">OE Quality</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
               </div>
            </div>
          );
      })}

      {slides.length > 1 && (
          <>
            <button 
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-white/5 hover:bg-masuma-orange text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-white/5 hover:bg-masuma-orange text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10"
            >
                <ChevronRight size={24} />
            </button>
          </>
      )}

      {slides.length > 1 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-4">
              {slides.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1 transition-all rounded-full ${i === currentSlide ? 'w-12 bg-masuma-orange' : 'w-4 bg-white/30 hover:bg-white/60'}`}
                  ></button>
              ))}
          </div>
      )}

    </div>
    </>
  );
};

export default Hero;
