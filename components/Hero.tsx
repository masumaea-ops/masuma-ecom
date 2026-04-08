import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShieldCheck, TrendingUp, Wrench, ChevronLeft, ChevronRight, Loader2, Shield } from 'lucide-react';
import { ViewState, HeroSlide } from '../types';
import { apiClient } from '../utils/apiClient';

interface HeroProps {
    setView: (view: ViewState) => void;
}

const DEFAULT_SLIDES: HeroSlide[] = [
    {
        id: 'default-1',
        title: 'JAPANESE PRECISION.\nKENYAN STRENGTH.',
        subtitle: 'The official home of genuine Masuma spark plugs, brake pads, and filters in Nairobi. Engineered in Tokyo to dominate the toughest roads in East Africa.',
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
      // Fix Error 153 by using standard youtube.com and providing the origin parameter
      // This is required for the YouTube IFrame API to handshake correctly
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
  };

  const isYoutube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

  if (slides.length === 0) {
      return (
        <div className="h-[600px] bg-masuma-dark flex items-center justify-center">
            <h1 className="sr-only">Masuma Autoparts East Africa - Genuine Japanese Spare Parts</h1>
            <Loader2 className="animate-spin text-masuma-orange" size={48} />
        </div>
      );
  }

  return (
    <>
    {announcement && (
        <div style={{ backgroundColor: announcementColor }} className="text-white text-center text-xs font-bold py-2.5 uppercase tracking-widest relative z-20 shadow-md">
            {announcement}
        </div>
    )}
    <div className="relative bg-masuma-dark overflow-hidden h-[600px] md:h-[750px] group select-none" onContextMenu={(e) => e.preventDefault()}>
      
      {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div 
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
               <div className="absolute inset-0 bg-black pointer-events-none">
                   {isActive && (
                       <>
                           {slide.mediaType === 'youtube' && slide.videoUrl ? (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    <iframe 
                                        src={getYoutubeEmbedUrl(slide.videoUrl)} 
                                        className="w-full h-full object-cover opacity-90 scale-150 media-protected"
                                        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        frameBorder="0"
                                        title="Background Video"
                                    ></iframe>
                                </div>
                           ) : slide.mediaType === 'video' && slide.videoUrl ? (
                               <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                   <video 
                                       src={slide.videoUrl}
                                       autoPlay
                                       muted
                                       loop
                                       playsInline
                                       className="w-full h-full object-cover opacity-90 media-protected"
                                   />
                               </div>
                           ) : (
                               <div 
                                  className="absolute inset-0 bg-cover bg-center opacity-85 media-protected"
                                  style={{ backgroundImage: `url('${slide.image}')` }}
                               ></div>
                           )}
                       </>
                   )}
                   
                   {/* HERO DIGITAL WATERMARK - Updated Text */}
                   <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10">
                        <svg width="100%" height="100%">
                            <pattern id="wm-hero" x="0" y="0" width="300" height="300" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                                <text x="0" y="150" className="font-display font-bold text-4xl uppercase tracking-[0.5em] fill-white">MASUMA EA LTD</text>
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#wm-hero)" />
                        </svg>
                   </div>
               </div>
               
               <div className="absolute inset-0 bg-gradient-to-r from-masuma-dark via-masuma-dark/40 to-transparent z-20"></div>

               <div className="absolute inset-0 flex items-center z-30">
                  <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                      <div className="max-w-3xl">
                          <div className="inline-flex items-center gap-3 bg-white/10 border-l-4 border-masuma-orange text-white text-xs font-bold px-4 py-2 mb-8 uppercase tracking-widest backdrop-blur-md">
                              <span className="w-2 h-2 bg-masuma-orange rounded-full animate-pulse"></span>
                              <span>Authentic Masuma Limited</span>
                          </div>
                          
                          <h1 
                            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 md:mb-8 font-display uppercase tracking-tight whitespace-pre-line leading-[1.1] md:leading-[0.9] animate-slam-in text-balance"
                            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                          >
                              {slide.title}
                          </h1>
                          
                          <p 
                            className="text-base md:text-lg text-gray-200 mb-10 max-w-xl font-medium leading-relaxed drop-shadow-md border-l border-white/20 pl-6"
                          >
                              {slide.subtitle}
                          </p>
                          
                              <div className="flex flex-wrap gap-4">
                                  <a 
                                      href={`/?view=${slide.ctaLink}`}
                                      onClick={(e) => { e.preventDefault(); setView(slide.ctaLink as ViewState); }}
                                      className="bg-masuma-orange hover:bg-white hover:text-masuma-orange text-white font-bold px-8 md:px-12 py-4 md:py-5 rounded-none transition duration-300 uppercase tracking-[0.2em] text-sm flex items-center gap-3 shadow-2xl group/btn"
                                      aria-label={slide.ctaText}
                                  >
                                      {slide.ctaText} <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                                  </a>
                                  
                                  <a 
                                      href="https://wa.me/254792506590?text=Hello%20Masuma%20East%20Africa,%20I%20am%20interested%20in%20genuine%20Japanese%20spare%20parts."
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-[#25D366] hover:border-[#25D366] text-white font-bold px-8 md:px-12 py-4 md:py-5 rounded-none transition duration-300 uppercase tracking-[0.2em] text-sm flex items-center gap-3 shadow-2xl"
                                      aria-label="Chat on WhatsApp"
                                  >
                                      Chat on WhatsApp
                                  </a>
                              
                              <div className="flex items-center gap-8 text-white ml-0 md:ml-6 drop-shadow-md opacity-80">
                                  <div className="flex flex-col items-center">
                                      <ShieldCheck size={28} className="text-masuma-orange mb-1" />
                                      <span className="text-xs uppercase font-bold tracking-wider">1Yr Warranty</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                      <TrendingUp size={28} className="text-masuma-orange mb-1" />
                                      <span className="text-xs uppercase font-bold tracking-wider">OE Quality</span>
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
                className="absolute left-6 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full bg-white/5 hover:bg-masuma-orange text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10 focus-ring touch-target"
                aria-label="Previous slide"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-40 p-4 rounded-full bg-white/5 hover:bg-masuma-orange text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10 focus-ring touch-target"
                aria-label="Next slide"
            >
                <ChevronRight size={24} />
            </button>
          </>
      )}

      {slides.length > 1 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex gap-4">
              {slides.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-1 transition-all rounded-full focus-ring touch-target ${i === currentSlide ? 'w-12 bg-masuma-orange' : 'w-4 bg-white/30 hover:bg-white/60'}`}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-pressed={i === currentSlide}
                  ></button>
              ))}
          </div>
      )}

    </div>
    </>
  );
};

export default Hero;