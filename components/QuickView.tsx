import React, { useState, useEffect, useRef } from 'react';
import { X, Check, AlertTriangle, Truck, MessageCircle, Plus, Minus, Share2, ChevronLeft, ChevronRight, Play, Info, ShieldCheck, Settings, Hash, Maximize2, ZoomIn, ReceiptText, Calculator, Shield, Minimize2, ShoppingCart, ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../types';
import QuoteModal from './QuoteModal';
import Price from './Price';
import { apiClient } from '../utils/apiClient';
import SEO from './SEO';

interface QuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  onSwitchProduct?: (product: Product) => void;
}

interface MediaItem {
    url: string;
    type: 'image' | 'video';
}

const QuickView: React.FC<QuickViewProps> = ({ product, isOpen, onClose, addToCart, onSwitchProduct }) => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (isOpen && product) {
        setQuantity(1);
        setIsFullScreen(false);
        const items: MediaItem[] = [];
        if (product.image) items.push({ url: product.image, type: 'image' });
        if (product.images && Array.isArray(product.images)) {
            product.images.forEach(img => {
                if (img !== product.image) items.push({ url: img, type: 'image' });
            });
        }
        if (product.videoUrl) items.push({ url: product.videoUrl, type: 'video' });
        if (items.length === 0) items.push({ url: 'https://via.placeholder.com/800x800?text=No+Product+Image', type: 'image' });

        setMedia(items);
        setActiveMediaIndex(0);
        fetchRelatedProducts(product);
    }
  }, [isOpen, product]);

  const fetchRelatedProducts = async (currentProduct: Product) => {
      try {
          const res = await apiClient.get(`/products?category=${currentProduct.category}&limit=6`);
          const allProducts = res.data.data || res.data || [];
          setRelatedProducts(allProducts.filter((p: Product) => p.id !== currentProduct.id));
      } catch (error) {
          console.error("Failed to fetch related products", error);
      }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!stageRef.current) return;
      const { left, top, width, height } = stageRef.current.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      setZoomPosition({ x, y });
  };

  if (!isOpen || !product) return null;

  const isYoutubeUrl = (url: string) => {
      return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYoutubeEmbedUrl = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : null;
      if (!id) return '';
      
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      // Fix Error 153 by using standard youtube.com and providing the origin parameter
      // This is required for the YouTube IFrame API to handshake correctly
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
  };

  const handleSwitch = (p: Product) => {
      if (onSwitchProduct) {
          const contentDiv = document.getElementById('sidebar-content');
          if (contentDiv) contentDiv.scrollTop = 0;
          onSwitchProduct(p);
      }
  };

  const activeMedia = media[activeMediaIndex];
  const basePrice = product.price / 1.16;
  const vatAmount = product.price - basePrice;

  return (
    <>
      <SEO title={product.name} description={product.description} image={product.image} type="product" />

      {/* Product Structured Data */}
      <script type="application/ld+json">
      {JSON.stringify([
        {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": product.name,
          "image": [product.image, ...(product.images || [])],
          "description": product.description,
          "sku": product.sku,
          "brand": {
            "@type": "Brand",
            "name": "Masuma"
          },
          "offers": {
            "@type": "Offer",
            "url": `${window.location.origin}/?product=${product.id}`,
            "priceCurrency": "KES",
            "price": product.price,
            "availability": product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": window.location.origin
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": product.category,
              "item": `${window.location.origin}/?view=CATALOG&category=${product.category}`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": product.name,
              "item": `${window.location.origin}/?product=${product.id}`
            }
          ]
        }
      ])}
      </script>

      <div className={`fixed inset-0 z-[2000] flex items-center justify-center overflow-hidden transition-all duration-500 ${isFullScreen ? 'p-0' : 'p-0 sm:p-4 md:p-6 lg:p-10'}`}>
        <div className="absolute inset-0 bg-masuma-dark/98 backdrop-blur-3xl transition-opacity" onClick={onClose}></div>
        
        <div className={`relative bg-white w-full h-full shadow-2xl flex flex-col overflow-hidden animate-scale-up border border-white/5 transition-all duration-500 ${isFullScreen ? 'max-w-none max-h-none rounded-none' : 'max-w-[1450px] max-h-[92vh] sm:rounded-3xl'}`}>
          
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Media Section */}
            <div className="w-full h-[40vh] lg:h-full lg:w-[55%] bg-[#050505] relative flex flex-col min-h-0 group/stage overflow-hidden">
                <div className="flex-1 relative overflow-hidden flex items-center justify-center"
                     ref={stageRef}
                     onMouseMove={handleMouseMove}
                     onMouseEnter={() => setIsZoomed(true)}
                     onMouseLeave={() => setIsZoomed(false)}>
                    
                    {activeMedia?.type === 'video' ? (
                        <div className="relative w-full h-full aspect-video rounded-lg shadow-2xl overflow-hidden bg-black max-w-4xl">
                            {isYoutubeUrl(activeMedia.url) ? (
                                <iframe 
                                    src={getYoutubeEmbedUrl(activeMedia.url)} 
                                    className="w-full h-full" 
                                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    loading="lazy"
                                    title={`${product.name} Video`}
                                ></iframe>
                            ) : (
                                <video 
                                    src={activeMedia.url} 
                                    className="w-full h-full object-contain" 
                                    autoPlay 
                                    muted 
                                    loop 
                                    playsInline 
                                    controls
                                />
                            )}
                            <div className="absolute top-4 left-4 bg-masuma-dark/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-none">
                                <span className="text-[8px] font-black uppercase text-white/80 tracking-widest flex items-center gap-2">
                                    <Shield size={10} className="text-masuma-orange"/> Masuma EA Ltd Official Content
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-zoom-in">
                            <img 
                                src={activeMedia?.url} 
                                alt={product.name} 
                                style={isZoomed ? {
                                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                    transform: 'scale(2.5)'
                                } : { transform: 'scale(1)' }} 
                                className={`max-w-full max-h-[75vh] object-contain transition-transform duration-200 ease-out will-change-transform ${!isZoomed ? 'drop-shadow-[0_15px_35px_rgba(255,255,255,0.05)]' : ''}`} 
                                onContextMenu={(e) => e.preventDefault()}
                            />
                            
                            {/* PREMIUM WATERMARK OVERLAY */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none">
                                <p className="text-[12vw] font-black uppercase tracking-[0.2em] -rotate-12 whitespace-nowrap text-white">Authentic Masuma</p>
                            </div>

                            {/* AUTHENTICITY BADGE */}
                            <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 pointer-events-none flex items-center gap-2 shadow-2xl">
                                <ShieldCheck size={14} className="text-masuma-orange" />
                                <span className="text-[9px] font-black uppercase text-white tracking-[0.1em]">Verified Masuma E.A. Part</span>
                            </div>

                            {!isZoomed && activeMedia?.type === 'image' && (
                                <div className="absolute bottom-6 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                    <ZoomIn size={12} className="text-masuma-orange" />
                                    <span className="text-[9px] font-black uppercase text-white/60 tracking-widest">Precision Hover Zoom</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Media Controls */}
                    <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover/stage:opacity-100 transition-all duration-500 translate-x-4 group-hover/stage:translate-x-0 z-[100]">
                        <button 
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-masuma-orange hover:border-masuma-orange transition-all shadow-2xl focus-ring touch-target"
                            title="Toggle Cinema Mode"
                            aria-label={isFullScreen ? "Exit cinema mode" : "Enter cinema mode"}
                        >
                            {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        <button 
                            onClick={() => window.open(`https://wa.me/?text=Check this Masuma part: ${window.location.origin}/?product=${product.id}`, '_blank')}
                            className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-masuma-orange hover:border-masuma-orange transition-all shadow-2xl focus-ring touch-target"
                            title="Share Part"
                            aria-label="Share this product on WhatsApp"
                        >
                            <Share2 size={20} />
                        </button>
                        <button 
                            onClick={onClose}
                            className="h-12 px-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-masuma-orange hover:border-masuma-orange transition-all shadow-2xl focus-ring touch-target"
                            aria-label="Close quick view"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Close</span>
                            <X size={24} />
                        </button>
                    </div>

                    {media.length > 1 && (
                        <>
                            <button 
                                onClick={() => setActiveMediaIndex((prev) => (prev - 1 + media.length) % media.length)} 
                                className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-masuma-orange hover:border-masuma-orange transition-all opacity-0 group-hover/stage:opacity-100 shadow-2xl z-50 focus-ring touch-target"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={28} />
                            </button>
                            <button 
                                onClick={() => setActiveMediaIndex((prev) => (prev + 1) % media.length)} 
                                className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl flex items-center justify-center hover:bg-masuma-orange hover:border-masuma-orange transition-all opacity-0 group-hover/stage:opacity-100 shadow-2xl z-50 focus-ring touch-target"
                                aria-label="Next image"
                            >
                                <ChevronRight size={28} />
                            </button>
                        </>
                    )}
                </div>

                {/* Thumbnail Gallery */}
                {media.length > 1 && (
                    <div className="h-28 bg-black/40 backdrop-blur-2xl border-t border-white/5 flex items-center px-8 gap-4 overflow-x-auto scrollbar-hide">
                        {media.map((item, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => setActiveMediaIndex(idx)} 
                                className={`relative w-20 h-20 shrink-0 border-2 transition-all duration-500 rounded-2xl overflow-hidden group/thumb focus-ring touch-target ${activeMediaIndex === idx ? 'border-masuma-orange scale-105 shadow-lg shadow-masuma-orange/20' : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30 grayscale hover:grayscale-0'}`}
                                aria-label={`View ${item.type} ${idx + 1}`}
                                aria-pressed={activeMediaIndex === idx}
                            >
                                {item.type === 'video' ? (
                                    <div className="w-full h-full bg-masuma-dark flex items-center justify-center text-white">
                                        <Play size={24} fill="currentColor" />
                                    </div>
                                ) : (
                                    <img src={item.url} className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-110" alt="" />
                                )}
                                {activeMediaIndex === idx && (
                                    <div className="absolute inset-0 bg-masuma-orange/10"></div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Details Section */}
            <div id="sidebar-content" className="w-full lg:w-[45%] flex flex-col bg-white overflow-y-auto border-l border-gray-100 scrollbar-hide">
                <div className="p-8 lg:p-12 space-y-10">
                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 text-gray-400 hover:text-masuma-orange transition-colors group/back mb-2"
                        aria-label="Back to product list"
                    >
                        <ChevronLeft size={20} className="group-hover/back:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Catalog</span>
                    </button>

                    <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                        <span className="bg-masuma-dark text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{product.category}</span>
                        {product.stock ? (
                            <span className="text-green-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full"><Check size={14} strokeWidth={3} /> In Stock Nairobi</span>
                        ) : (
                            <span className="text-red-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full"><AlertTriangle size={14} strokeWidth={3} /> Special Order Only</span>
                        )}
                    </div>
                        <h2 className="text-xl lg:text-3xl font-bold text-masuma-dark uppercase tracking-tight leading-[0.9]">{product.name}</h2>
                        
                        <div className="pt-8 border-t border-gray-50 space-y-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Calculator size={14}/> Total Price (Payable)</span>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl lg:text-4xl font-bold text-masuma-orange tracking-tighter"><Price amount={product.price} /></span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">incl. 16% VAT</span>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="grid grid-cols-2 divide-x divide-gray-200">
                                    <div className="p-6">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none block mb-2">Base Price</span>
                                        <span className="text-lg font-bold text-masuma-dark"><Price amount={basePrice} /></span>
                                    </div>
                                    <div className="p-6">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none block mb-2">VAT (16%)</span>
                                        <span className="text-lg font-bold text-gray-600"><Price amount={vatAmount} /></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                        <div className="space-y-8">
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-masuma-dark uppercase tracking-widest flex items-center gap-3 border-l-4 border-masuma-orange pl-4">Technical Specifications</h4>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <div className="group">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-masuma-orange transition-colors">Global SKU</p>
                                        <p className="text-sm font-bold text-masuma-dark uppercase tracking-tight">{product.sku}</p>
                                    </div>
                                    <div className="group">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-masuma-orange transition-colors">Grade</p>
                                        <p className="text-sm font-bold text-masuma-dark uppercase tracking-tight">Japanese OE Std</p>
                                    </div>
                                    {Object.entries(product.specs || {}).map(([key, value]) => (
                                        <div key={key} className="group">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 group-hover:text-masuma-orange transition-colors">{key}</p>
                                            <p className="text-sm font-bold text-masuma-dark uppercase tracking-tight">{String(value)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-bold text-masuma-dark uppercase tracking-widest opacity-60">Part Description</h4>
                                <p className="text-sm text-gray-600 leading-relaxed font-normal">{product.description}</p>
                            </div>

                            <div className="bg-masuma-dark text-white p-8 rounded-3xl shadow-2xl border-l-8 border-masuma-orange relative overflow-hidden group/fitment">
                                <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12 group-hover/fitment:scale-110 transition-transform duration-700"><Check size={80}/></div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-3">Verified Vehicle Fitment</h4>
                                <p className="text-sm text-gray-200 font-bold leading-relaxed">{(product.compatibility || []).join(' • ')}</p>
                                <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-masuma-orange"/>
                                    <span className="text-xs text-masuma-orange uppercase font-bold tracking-wider italic">Chassis verification recommended</span>
                                </div>
                            </div>
                        </div>

                    <div className="pt-4 space-y-8">
                        <div className="flex gap-4">
                            {product.stock && (
                                <div className="flex items-center bg-gray-100 rounded-2xl p-1.5 border border-gray-200">
                                    <button 
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                                        className="w-12 h-12 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl text-masuma-dark transition-all disabled:opacity-30 touch-target focus-ring" 
                                        disabled={quantity <= 1}
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus size={18} strokeWidth={3} />
                                    </button>
                                    <span className="w-12 text-center font-bold text-masuma-dark text-lg" aria-live="polite">{quantity}</span>
                                    <button 
                                        onClick={() => setQuantity(q => q + 1)} 
                                        className="w-12 h-12 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl text-masuma-dark transition-all touch-target focus-ring"
                                        aria-label="Increase quantity"
                                    >
                                        <Plus size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={() => { addToCart(product, quantity); onClose(); }} 
                                disabled={!product.stock} 
                                className={`flex-1 h-16 font-bold uppercase tracking-widest text-sm transition-all shadow-2xl rounded-2xl active:scale-95 flex items-center justify-center gap-3 focus-ring ${product.stock ? 'bg-masuma-dark text-white hover:bg-masuma-orange shadow-masuma-dark/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                aria-label={product.stock ? `Add ${quantity} ${product.name} to cart` : 'Product out of stock'}
                            >
                                <ShoppingCart size={20} /> {product.stock ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                            <button 
                                onClick={() => setIsQuoteModalOpen(true)} 
                                className="w-16 h-16 bg-gray-100 text-masuma-dark hover:bg-masuma-orange hover:text-white transition-all flex items-center justify-center rounded-2xl shadow-xl active:scale-95 border border-gray-200 focus-ring" 
                                aria-label="Request technical inquiry"
                            >
                                <MessageCircle size={24} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-4 group/feat">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover/feat:bg-masuma-orange transition-all duration-500 group-hover/feat:rotate-12 shadow-sm">
                                    <Truck size={20} className="text-masuma-orange group-hover/feat:text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-masuma-dark">Same-Day</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Nairobi Delivery</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group/feat">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover/feat:bg-masuma-orange transition-all duration-500 group-hover/feat:rotate-12 shadow-sm">
                                    <ShieldCheck size={20} className="text-masuma-orange group-hover/feat:text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-masuma-dark">12 Month</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Limited Warranty</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {relatedProducts.length > 0 && (
                        <div className="pt-10 space-y-6">
                            <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                                <h4 className="text-[10px] font-black text-masuma-dark uppercase tracking-[0.3em]">Complementary Parts</h4>
                                <span className="text-[9px] text-masuma-orange font-black uppercase tracking-widest">Local Stock</span>
                            </div>
                            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                                {relatedProducts.map(rp => (
                                    <div key={rp.id} onClick={() => handleSwitch(rp)} className="min-w-[160px] w-[160px] bg-white border border-gray-100 p-4 hover:border-masuma-orange hover:shadow-2xl transition-all cursor-pointer snap-start rounded-[2rem] group/card">
                                        <div className="aspect-square flex items-center justify-center mb-4 bg-gray-50 overflow-hidden rounded-2xl"><img src={rp.image} className="max-h-full max-w-full object-contain p-4 group-hover/card:scale-110 transition-transform duration-700" alt="" /></div>
                                        <div className="text-[10px] font-black text-masuma-dark line-clamp-2 h-8 leading-tight mb-2 uppercase tracking-tight">{rp.name}</div>
                                        <div className="text-xs font-black text-masuma-orange tracking-tighter">KES {rp.price.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-10 border-t border-gray-100">
                        <button 
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl border-2 border-masuma-dark text-masuma-dark font-black uppercase tracking-widest text-xs hover:bg-masuma-dark hover:text-white transition-all active:scale-95 focus-ring touch-target"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <QuoteModal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} product={product} />
    </>
  );
};

export default QuickView;