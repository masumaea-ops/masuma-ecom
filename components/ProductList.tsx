import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { Search, AlertCircle, Eye, ShoppingBag, Plane, ChevronLeft, ChevronRight, Filter, ShieldCheck } from 'lucide-react';
import VinSearch from './VinSearch';
import { apiClient } from '../utils/apiClient';
import Price from './Price';
import SourcingModal from './SourcingModal';
import { trackProductView, trackAddToCart, trackSearch } from '../utils/analytics';

interface ProductListProps {
  addToCart: (product: Product, quantity?: number) => void;
  onProductClick: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ addToCart, onProductClick }) => {
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [vinFilter, setVinFilter] = useState('');
  const [error, setError] = useState(false);
  
  const [isSourcingOpen, setIsSourcingOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const ITEMS_PER_PAGE = 12;

  // Fetch Categories on Mount
  useEffect(() => {
      const fetchCategories = async () => {
          try {
              const res = await apiClient.get('/categories');
              if (res.data && Array.isArray(res.data)) {
                  const catNames = res.data.map((c: any) => c.name);
                  setCategories(['All', ...catNames]);
              }
          } catch (e) {
              setCategories(['All', 'Filters', 'Brakes', 'Suspension']);
          }
      };
      fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
        setIsLoading(true);
        setError(false);
        try {
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('limit', ITEMS_PER_PAGE.toString());
            if (searchQuery) params.append('q', searchQuery);
            if (selectedCategory !== 'All') params.append('category', selectedCategory);
            
            const response = await apiClient.get(`/products?${params.toString()}`);
            const responseData = response.data;
            
            if (responseData.data && Array.isArray(responseData.data)) {
                setProducts(responseData.data);
                if (responseData.meta) {
                    setTotalPages(responseData.meta.pages || 1);
                    setTotalProducts(responseData.meta.total || 0);
                }
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('API Error', error);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const timer = setTimeout(() => {
        if (searchQuery) trackSearch(searchQuery);
        fetchProducts();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, currentPage]); 

  useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const displayProducts = useMemo(() => {
    let filtered = products;
    if (vinFilter) {
        filtered = filtered.filter(product => 
            product.compatibility.some((c: string) => c.toLowerCase().includes(vinFilter.toLowerCase()) || vinFilter.toLowerCase().includes(c.toLowerCase()))
        );
    }
    return filtered;
  }, [vinFilter, products]);

  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
          setCurrentPage(newPage);
          const listElement = document.getElementById('product-list-top');
          if (listElement) {
              listElement.scrollIntoView({ behavior: 'smooth' });
          }
      }
  };

  const handleCardClick = (e: React.MouseEvent, product: Product) => {
      e.preventDefault();
      trackProductView(product.name, product.category);
      onProductClick(product);
  };

  const ProductSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 h-full flex flex-col animate-pulse overflow-hidden shadow-sm">
      <div className="h-64 bg-gray-100 w-full"></div>
      <div className="p-6 flex-1 flex flex-col space-y-4">
        <div className="h-6 bg-gray-100 w-3/4 rounded-lg"></div>
        <div className="h-4 bg-gray-100 w-1/2 rounded-lg"></div>
        <div className="h-16 bg-gray-50 w-full rounded-xl"></div>
        <div className="flex justify-between items-center mt-auto pt-4">
            <div className="h-8 bg-gray-100 w-24 rounded-lg"></div>
            <div className="h-10 w-10 bg-gray-100 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div id="product-list-top" className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SourcingModal isOpen={isSourcingOpen} onClose={() => setIsSourcingOpen(false)} />

      <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-masuma-orange/10 text-masuma-orange rounded-full mb-4">
                <Filter size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">Local Inventory</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-masuma-dark mb-4 font-display uppercase tracking-tight">Parts Catalog</h2>
            <p className="text-gray-600 max-w-2xl text-lg font-normal leading-relaxed">
            High-precision components engineered for the tough East African terrain. 100% Genuine Masuma spark plugs, brake pads, filters, and suspension parts.
            </p>
        </div>
      </div>

      <VinSearch onVehicleIdentified={setVinFilter} />

      {/* Modern Floating Search/Filter Bar */}
      <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-xl p-3 shadow-xl shadow-black/5 border border-gray-100 mb-12 rounded-2xl transition-all">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="w-full lg:w-1/3 relative group">
            <input
              type="text"
              placeholder="Search by SKU, Name, or OEM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-masuma-orange rounded-xl outline-none text-sm font-medium transition-all focus-ring"
              aria-label="Search product catalog"
            />
            <Search className="absolute left-4 top-4.5 text-gray-400 group-focus-within:text-masuma-orange transition-colors" size={20} />
          </div>

          <div className="w-full lg:w-2/3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 p-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 rounded-xl border-2 touch-target ${
                    selectedCategory === cat
                      ? 'bg-masuma-dark border-masuma-dark text-white shadow-lg shadow-masuma-dark/20 translate-y-[-2px]'
                      : 'bg-white border-gray-100 text-gray-600 hover:border-masuma-orange hover:text-masuma-orange'
                  }`}
                  aria-label={`Filter by ${cat}`}
                  aria-pressed={selectedCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
           <div className="flex flex-col items-center justify-center py-24 text-center bg-red-50/50 rounded-3xl border border-red-100">
                <div className="p-8 bg-white rounded-full mb-6 text-red-500 shadow-xl shadow-red-500/10"><AlertCircle size={56} /></div>
                <h3 className="text-2xl font-bold text-masuma-dark font-display uppercase tracking-tight">Database Offline</h3>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">We're experiencing a temporary connection issue with our warehouse servers.</p>
                <button onClick={() => window.location.reload()} className="px-10 py-3 bg-masuma-dark text-white rounded-xl font-bold uppercase text-xs tracking-[0.2em] shadow-lg hover:bg-masuma-orange transition-all">Reconnect</button>
           </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
           {[1,2,3,4,5,6,7,8,9,10].map(i => <ProductSkeleton key={i} />)}
        </div>
      ) : !error && displayProducts.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center">
          <div className="inline-flex p-8 bg-white rounded-full shadow-xl mb-8">
            <Search className="text-masuma-orange opacity-20" size={56} />
          </div>
          <h3 className="text-3xl font-bold text-masuma-dark font-display uppercase tracking-tight">No Match Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mt-2 mb-10 text-lg font-light leading-relaxed">
            We couldn't find a match for "{searchQuery}" {vinFilter && `for ${vinFilter}`}.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => {setSearchQuery(''); setSelectedCategory('All'); setVinFilter('');}}
                className="px-8 py-4 bg-white border border-gray-200 text-gray-500 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-100 transition shadow-sm"
              >
                Reset Filters
              </button>
              
              <button 
                onClick={() => setIsSourcingOpen(true)}
                className="px-10 py-4 bg-masuma-orange text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-masuma-dark transition shadow-xl shadow-masuma-orange/20 flex items-center gap-2"
              >
                <Plane size={16} className="transform -rotate-45" /> Request Special Sourcing
              </button>
          </div>
        </div>
      ) : !error && (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
            {displayProducts.map((product) => (
                <a 
                    key={product.id}
                    href={`/?product=${product.id}`}
                    onClick={(e) => handleCardClick(e, product)}
                    className="group bg-white border border-gray-100 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-700 flex flex-col h-full relative overflow-hidden rounded-[2.5rem] cursor-pointer block shadow-sm"
                    onContextMenu={(e) => e.preventDefault()}
                >
                
                {/* Enhanced Image Container */}
                <div className="relative h-80 bg-gradient-to-br from-gray-50 to-white p-10 flex items-center justify-center overflow-hidden rounded-t-[2.5rem] border-b border-gray-50 select-none">
                    <img 
                    src={product.image || (product as any).images?.[0]} 
                    alt={`${product.name} - Masuma Genuine Part Kenya`} 
                    loading="lazy"
                    className="max-w-full max-h-full object-contain transform group-hover:scale-110 transition duration-1000 ease-out drop-shadow-2xl media-protected"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Masuma+Part';
                    }}
                    />
                    
                    {/* PREMIUM WATERMARK OVERLAY */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] transition-opacity group-hover:opacity-[0.06]">
                        <svg width="100%" height="100%">
                            <pattern id={`wm-card-${product.id}`} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                                <text x="0" y="60" className="font-display font-bold text-[10px] uppercase tracking-widest fill-masuma-dark">MASUMA EA LTD</text>
                            </pattern>
                            <rect width="100%" height="100%" fill={`url(#wm-card-${product.id})`} />
                        </svg>
                    </div>

                    {/* Gloss Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>

                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                        <span className="bg-white/90 backdrop-blur-md text-masuma-dark text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider border border-gray-100 shadow-sm">
                            {product.category}
                        </span>
                        {!product.stock && (
                            <span className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-red-500/20">
                                Sold Out
                            </span>
                        )}
                    </div>

                    <div className="absolute inset-0 bg-masuma-dark/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 backdrop-blur-md">
                        <span 
                            className="bg-white text-masuma-dark hover:bg-masuma-orange hover:text-white px-10 py-5 font-black uppercase text-[11px] tracking-[0.3em] flex items-center gap-3 transform translate-y-12 group-hover:translate-y-0 transition-all duration-500 shadow-2xl rounded-2xl active:scale-95"
                        >
                            <Eye size={18} /> Quick View
                        </span>
                    </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-masuma-orange rounded-full"></div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Genuine Japanese Part</span>
                        </div>
                        <h3 className="text-2xl font-bold text-masuma-dark leading-tight font-display group-hover:text-masuma-orange transition-colors line-clamp-2 h-14 uppercase tracking-tight">
                            {product.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-bold tracking-wider mt-3 uppercase">SKU: {product.sku}</p>
                    </div>

                    <div className="mt-auto space-y-6">
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100/50 h-20 flex flex-col justify-center group-hover:bg-white group-hover:border-masuma-orange/20 transition-colors">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1.5">Compatibility:</p>
                            <p className="text-xs text-gray-700 line-clamp-1 font-semibold uppercase tracking-tight" title={(product.compatibility || []).join(', ')}>
                                {(product.compatibility || []).join(', ')}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-masuma-dark tracking-tighter">
                                    <Price amount={product.price} />
                                </span>
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Incl. 16% VAT</span>
                            </div>
                            <button
                                onClick={(e) => { 
                                    e.preventDefault(); 
                                    e.stopPropagation(); 
                                    trackAddToCart(product.name, product.price);
                                    addToCart(product); 
                                }}
                                disabled={!product.stock}
                                className={`w-16 h-16 rounded-2xl transition-all duration-700 shadow-2xl flex items-center justify-center group/cart-btn focus-ring ${
                                    product.stock 
                                    ? 'bg-masuma-dark text-white group-hover:bg-masuma-orange hover:scale-110 shadow-masuma-dark/20' 
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                }`}
                                aria-label={`Add ${product.name} to cart`}
                            >
                                <ShoppingBag size={24} className="group-hover/cart-btn:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
                </a>
            ))}
            </div>

            {/* Modern Curved Pagination */}
            {totalPages > 1 && (
                <div className="mt-20 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-masuma-orange hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        
                        <div className="flex gap-1 px-4">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pNum = i + 1;
                                if (totalPages > 5) {
                                    if (currentPage > 3) pNum = currentPage - 2 + i;
                                    if (pNum > totalPages) pNum = totalPages - (4 - i);
                                }
                                
                                return (
                                    <button
                                        key={pNum}
                                        onClick={() => handlePageChange(pNum)}
                                        className={`w-12 h-12 text-xs font-black rounded-xl transition-all ${
                                            currentPage === pNum 
                                            ? 'bg-masuma-dark text-white shadow-xl shadow-masuma-dark/20' 
                                            : 'bg-transparent text-gray-400 hover:text-masuma-dark'
                                        }`}
                                    >
                                        {pNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-masuma-orange hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>
                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
                        Page {currentPage} of {totalPages} • {totalProducts} items
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default ProductList;