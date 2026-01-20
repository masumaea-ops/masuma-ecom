import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Truck, MessageCircle, Plus, Minus, ArrowRight, Share2, Facebook, Twitter, ChevronLeft, ChevronRight, Play } from 'lucide-react';
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
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  
  // Carousel State
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
        // Deep linking logic
        const newUrl = `${window.location.pathname}?product=${product.id}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);

        setQuantity(1);
        
        // Construct Media Gallery
        const items: MediaItem[] = [];
        
        // 1. Start with the designated "Main Image"
        if (product.image) {
            items.push({ url: product.image, type: 'image' });
        }
        
        // 2. Add other images from the gallery, avoiding duplicate of main image
        if (product.images && Array.isArray(product.images)) {
            product.images.forEach(img => {
                if (img !== product.image) {
                    items.push({ url: img, type: 'image' });
                }
            });
        }
        
        // 3. Append Video if configured
        if (product.videoUrl) {
            items.push({ url: product.videoUrl, type: 'video' });
        }

        // If absolutely no images, add a placeholder to prevent broken UI
        if (items.length === 0) {
            items.push({ url: 'https://via.placeholder.com/600x600?text=No+Product+Image', type: 'image' });
        }

        setMedia(items);
        setActiveIndex(0);
        fetchRelatedProducts(product);
    } else if (!isOpen) {
        // Revert URL when closed
        const cleanUrl = window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }, [isOpen, product]);

  const fetchRelatedProducts = async (currentProduct: Product) => {
      setIsLoadingRelated(true);
      try {
          const res = await apiClient.get(`/products?category=${currentProduct.category}&limit=10`);
          const allProducts = res.data.data || res.data || [];
          const filtered = allProducts.filter((p: Product) => p.id !== currentProduct.id);
          setRelatedProducts(filtered);
      } catch (error) {
          console.error("Failed to fetch related products", error);
          setRelatedProducts([]);
      } finally {
          setIsLoadingRelated(false);
      }
  };

  if (!isOpen || !product) return null;

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % media.length);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + media.length) % media.length);

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  const handleSwitch = (p: Product) => {
      if (onSwitchProduct) {
          const contentDiv = document.getElementById('quickview-content');
          if (contentDiv) contentDiv.scrollTop = 0;
          onSwitchProduct(p);
      }
  };

  const getYoutubeEmbedUrl = (url: string) => {
      if (!url) return '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : null;
      if (!id) return '';
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
  };

  // Social Share Logic
  const shareUrl = `${window.location.origin}/?product=${product.id}`;
  const shareText = `Check out this ${product.name} at Masuma Autoparts EA!`;

  const handleSocialShare = (platform: 'whatsapp' | 'facebook' | 'twitter') => {
      let url = '';
      switch (platform) {
          case 'whatsapp':
              url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
              break;
          case 'facebook':
              url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
              break;
          case 'twitter':
              url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
              break;
      }
      window.open(url, '_blank', 'width=600,height=400');
  };

  const productSchema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": media.filter(m => m.type === 'image').map(m => m.url),
      "description": product.description,
      "sku": product.sku,
      "mpn": product.sku,
      "brand": { "@type": "Brand", "name": "Masuma" },
      "offers": {
          "@type": "Offer",
          "url": shareUrl,
          "priceCurrency": "KES",
          "price": product.price,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": product.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": { "@type": "Organization", "name": "Masuma Autoparts East Africa" }
      }
  };

  const activeMedia = media[activeIndex];

  return (
    <>
      <SEO 
        title={product.name} 
        description={product.description.substring(0, 160)} 
        image={product.image}
        type="product"
        schema={productSchema}
      />

      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
        
        <div className="relative bg-white w-full max-w-6xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-scale-up">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 z-50 p-2 bg-gray-100 hover:bg-masuma-orange hover:text-white rounded-full transition shadow-md border border-gray-200 group"
            aria-label="Close"
          >
            <X size={24} className="text-gray-600 group-hover:text-white" />
          </button>

          <div id="quickview-content" className="flex-1 overflow-y-auto bg-white">
            <div className="flex flex-col lg:flex-row border-b border-gray-200">
                
                {/* Image & Video Carousel Gallery Section */}
                <div className="w-full lg:w-3/5 bg-gray-50 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-100">
                    <div className="relative flex-1 flex items-center justify-center min-h-[400px] md:min-h-[500px] bg-white group/viewer">
                        {activeMedia?.type === 'video' ? (
                            <div className="w-full h-full aspect-video">
                                <iframe 
                                    src={getYoutubeEmbedUrl(activeMedia.url)}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        ) : (
                            <img 
                                src={activeMedia?.url || 'https://via.placeholder.com/600x600?text=No+Image'} 
                                alt={product.name} 
                                className="max-h-[400px] md:max-h-[500px] w-full object-contain transition-all duration-500" 
                            />
                        )}

                        {/* Navigation Arrows */}
                        {media.length > 1 && (
                            <>
                                <button 
                                    onClick={handlePrev}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/50 hover:bg-white text-masuma-dark rounded-full shadow-lg transition-all opacity-0 group-hover/viewer:opacity-100 backdrop-blur-sm"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button 
                                    onClick={handleNext}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/50 hover:bg-white text-masuma-dark rounded-full shadow-lg transition-all opacity-0 group-hover/viewer:opacity-100 backdrop-blur-sm"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                        
                        <div className="absolute bottom-4 left-6">
                            <span className="inline-block px-3 py-1 bg-masuma-dark text-white text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-lg">
                                {product.category}
                            </span>
                        </div>
                    </div>

                    {/* Thumbnail Strip */}
                    {media.length > 1 && (
                        <div className="bg-gray-100 p-4 border-t border-gray-200">
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x justify-center md:justify-start">
                                {media.map((item, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setActiveIndex(idx)}
                                        className={`relative w-20 h-20 shrink-0 border-2 rounded overflow-hidden transition-all snap-start ${activeIndex === idx ? 'border-masuma-orange ring-2 ring-masuma-orange/20 scale-105' : 'border-white hover:border-gray-300'}`}
                                    >
                                        {item.type === 'video' ? (
                                            <div className="w-full h-full bg-masuma-dark flex items-center justify-center">
                                                <Play size={20} className="text-white fill-current" />
                                            </div>
                                        ) : (
                                            <img src={item.url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="w-full lg:w-2/5 p-6 md:p-10 flex flex-col">
                    <div className="mb-8">
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <h2 className="text-2xl md:text-4xl font-bold text-masuma-dark font-display leading-[1.1]">{product.name}</h2>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="px-3 py-1 bg-masuma-orange text-white text-[10px] font-mono font-bold rounded-sm uppercase tracking-wider">SKU: {product.sku}</span>
                            {product.stock ? (
                                <span className="flex items-center gap-1 text-green-600 text-[10px] font-bold uppercase tracking-widest bg-green-50 px-2 py-1 rounded-sm">
                                    <Check size={12} /> In Stock
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 px-2 py-1 rounded-sm">
                                    <AlertTriangle size={12} /> Out of Stock
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mb-8 p-6 bg-gray-50 border-l-4 border-masuma-orange rounded-r-lg">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Local Retail Price</h3>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-bold text-masuma-dark">
                                <Price amount={product.price} />
                            </p>
                            <span className="text-xs text-gray-400 font-bold uppercase">Incl. VAT</span>
                        </div>
                    </div>

                    <div className="space-y-8 flex-1">
                        <div>
                            <h3 className="text-xs font-bold text-masuma-dark uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Description</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">OEM Fitment Guide</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {(product.oemNumbers || []).map((oem, i) => (
                                        <span key={i} className="px-2 py-1 bg-white border border-gray-200 text-gray-600 text-[10px] font-mono rounded-sm shadow-sm">{oem}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Tested Compatibility</h3>
                                <p className="text-sm text-gray-700 leading-relaxed">{(product.compatibility || []).join(' • ')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Social & Actions */}
                    <div className="mt-10 pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Share Part:</span>
                            <button onClick={() => handleSocialShare('whatsapp')} className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-600 hover:text-white transition shadow-sm">
                                <MessageCircle size={18} />
                            </button>
                            <button onClick={() => handleSocialShare('facebook')} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition shadow-sm">
                                <Facebook size={18} />
                            </button>
                            <button onClick={() => handleSocialShare('twitter')} className="p-2 bg-gray-50 text-masuma-dark rounded-full hover:bg-masuma-dark hover:text-white transition shadow-sm">
                                <Twitter size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            {product.stock && (
                                <div className="flex items-center border-2 border-masuma-dark rounded-sm h-[52px] shrink-0 bg-white">
                                    <button 
                                        onClick={() => handleQuantityChange(-1)}
                                        className="px-4 h-full text-gray-500 hover:bg-gray-100 transition"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="w-12 text-center font-bold text-masuma-dark text-lg">{quantity}</span>
                                    <button 
                                        onClick={() => handleQuantityChange(1)}
                                        className="px-4 h-full text-gray-500 hover:bg-gray-100 transition"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleAddToCart}
                                disabled={!product.stock}
                                className={`flex-1 h-[52px] font-bold uppercase tracking-[0.2em] text-xs transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${
                                    product.stock 
                                    ? 'bg-masuma-dark text-white hover:bg-masuma-orange' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {product.stock ? 'Buy Locally' : 'Sold Out'}
                            </button>
                            
                            <button
                                onClick={() => setIsQuoteModalOpen(true)}
                                className="flex-1 h-[52px] font-bold uppercase tracking-[0.2em] text-xs transition-all bg-white border-2 border-masuma-dark text-masuma-dark hover:bg-masuma-dark hover:text-white flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={20} />
                                Quote
                            </button>
                        </div>
                        
                        <div className="mt-6 flex items-center justify-center lg:justify-start gap-4">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Truck size={18} className="text-masuma-orange" />
                                <span className="text-[10px] uppercase font-black tracking-widest">Nairobi: Fast Delivery</span>
                            </div>
                            <div className="w-px h-4 bg-gray-200"></div>
                            <div className="flex items-center gap-2 text-gray-500">
                                <Check size={18} className="text-masuma-orange" />
                                <span className="text-[10px] uppercase font-black tracking-widest">1 Year Warranty</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
                <div className="p-8 md:p-12 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-masuma-dark uppercase tracking-tight font-display">
                            Related Parts
                        </h3>
                        <ArrowRight size={24} className="text-masuma-orange" />
                    </div>
                    
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                        {isLoadingRelated ? (
                            <div className="w-full text-center text-xs text-gray-400 py-12">Checking warehouse...</div>
                        ) : (
                            relatedProducts.map(rp => (
                                <div 
                                    key={rp.id} 
                                    onClick={() => handleSwitch(rp)}
                                    className="min-w-[220px] w-[220px] bg-white border border-gray-200 rounded-sm hover:shadow-2xl transition-all duration-300 cursor-pointer snap-start group flex flex-col"
                                >
                                    <div className="h-40 overflow-hidden bg-white relative p-4 flex items-center justify-center">
                                        <img src={rp.image} alt={rp.name} className="max-h-full max-w-full object-contain group-hover:scale-110 transition duration-700" />
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col border-t border-gray-50">
                                        <div className="text-[9px] text-gray-400 uppercase font-black mb-1 tracking-widest">{rp.sku}</div>
                                        <h4 className="text-xs font-bold text-masuma-dark leading-tight line-clamp-2 mb-3 group-hover:text-masuma-orange transition">
                                            {rp.name}
                                        </h4>
                                        <div className="mt-auto">
                                            <Price amount={rp.price} className="text-sm font-black text-masuma-dark" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      <QuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        product={product} 
      />
    </>
  );
};

export default QuickView;