
import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { Search, AlertCircle, Eye, ShoppingBag, Plane, ChevronLeft, ChevronRight } from 'lucide-react';
import VinSearch from './VinSearch';
import { apiClient } from '../utils/apiClient';
import Price from './Price';
import SourcingModal from './SourcingModal';

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
      e.preventDefault(); // Prevent full page reload
      onProductClick(product); // Trigger global modal opening and URL update
  };

  const ProductSkeleton = () => (
    <div className="bg-white border border-gray-200 h-full flex flex-col animate-pulse">
      <div className="h-56 bg-gray-100 w-full"></div>
      <div className="p-5 flex-1 flex flex-col space-y-3">
        <div className="h-6 bg-gray-100 w-3/4 rounded"></div>
        <div className="h-4 bg-gray-100 w-1/4 rounded"></div>
        <div className="h-12 bg-gray-100 w-full rounded mt-4"></div>
        <div className="h-10 bg-gray-100 w-full rounded mt-auto"></div>
      </div>
    </div>
  );

  return (
    <div id="product-list-top" className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SourcingModal isOpen={isSourcingOpen} onClose={() => setIsSourcingOpen(false)} />

      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-end">
        <div>
            <h2 className="text-3xl md:text-4xl font-bold text-masuma-dark mb-2 font-display uppercase tracking-tight">Parts Catalog</h2>
            <div className="h-1.5 w-24 bg-masuma-orange mb-4 mx-auto md:mx-0"></div>
            <p className="text-gray-600 max-w-2xl">
            Browse our extensive inventory of genuine Masuma parts. Engineered in Japan, proven in Kenya.
            </p>
        </div>
      </div>

      <VinSearch onVehicleIdentified={setVinFilter} />

      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-4 shadow-lg border-t-4 border-masuma-orange mb-8 -mx-4 sm:mx-0 sm:rounded-lg transition-all">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="w-full lg:w-1/3 relative group">
            <input
              type="text"
              placeholder="Search by Part Name, SKU, or OEM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-masuma-orange rounded-none outline-none text-sm font-medium transition-colors"
            />
            <Search className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-masuma-orange transition-colors" size={18} />
          </div>

          <div className="w-full lg:w-2/3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 rounded-sm border ${
                    selectedCategory === cat
                      ? 'bg-masuma-dark border-masuma-dark text-white shadow-md transform -translate-y-0.5'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-masuma-orange hover:text-masuma-orange'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
           <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-6 bg-red-50 rounded-full mb-4 text-red-500"><AlertCircle size={48} /></div>
                <h3 className="text-xl font-bold text-masuma-dark">Connection Error</h3>
                <p className="text-gray-500 mb-6">Could not connect to the product database.</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-masuma-dark text-white rounded font-bold uppercase text-sm">Retry</button>
           </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
           {[1,2,3,4,5,6,7,8,9,10].map(i => <ProductSkeleton key={i} />)}
        </div>
      ) : !error && displayProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center">
          <div className="inline-flex p-6 bg-white rounded-full shadow-sm mb-6">
            <Search className="text-masuma-orange" size={48} />
          </div>
          <h3 className="text-2xl font-bold text-masuma-dark font-display">Part Not Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mt-2 mb-8">
            We couldn't find a match for "{searchQuery}" {vinFilter && `compatible with ${vinFilter}`}.
            However, we can source it directly from Masuma Japan for you.
          </p>
          
          <div className="flex gap-4">
              <button 
                onClick={() => {setSearchQuery(''); setSelectedCategory('All'); setVinFilter('');}}
                className="px-8 py-3 bg-white border border-gray-300 text-gray-600 font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
              
              <button 
                onClick={() => setIsSourcingOpen(true)}
                className="px-8 py-3 bg-masuma-orange text-white font-bold uppercase tracking-widest text-xs hover:bg-orange-600 transition shadow-lg flex items-center gap-2"
              >
                <Plane size={16} className="transform -rotate-45" /> Request Special Import
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
                    className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col h-full relative overflow-hidden rounded-sm cursor-pointer block"
                >
                
                <div className="relative h-64 bg-gray-50 p-6 flex items-center justify-center overflow-hidden border-b border-gray-100">
                    <img 
                    src={(product as any).images?.[0] || product.image} 
                    alt={product.name} 
                    className="max-w-full max-h-full object-contain transform group-hover:scale-110 transition duration-700 ease-out"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Masuma+Part';
                    }}
                    />
                    
                    <div className="absolute top-0 left-0 p-3 w-full flex justify-between items-start">
                        <span className="bg-white/90 backdrop-blur text-masuma-dark text-[10px] font-bold px-2 py-1 uppercase tracking-wider border border-gray-200 shadow-sm">
                            {product.category}
                        </span>
                        {!product.stock && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider shadow-sm">
                                Sold Out
                            </span>
                        )}
                    </div>

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]">
                        <span 
                            className="bg-white text-masuma-dark hover:text-masuma-orange px-6 py-3 font-bold uppercase text-xs tracking-widest flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition duration-300 shadow-lg"
                        >
                            <Eye size={16} /> Quick View
                        </span>
                    </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-bold text-masuma-dark leading-tight font-display group-hover:text-masuma-orange transition-colors line-clamp-2 h-12">
                            {product.name}
                        </h3>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">SKU: {product.sku}</p>
                    </div>

                    <div className="mt-auto space-y-4">
                        <div className="p-3 bg-gray-50 rounded-sm border border-gray-100 h-14">
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Fits:</p>
                            <p className="text-xs text-gray-700 line-clamp-1" title={(product.compatibility || []).join(', ')}>
                                {(product.compatibility || []).join(', ')}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div>
                                <span className="text-lg font-bold text-masuma-dark">
                                    <Price amount={product.price} />
                                </span>
                            </div>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}
                                disabled={!product.stock}
                                className={`p-3 rounded-full transition-all duration-300 ${
                                    product.stock 
                                    ? 'bg-masuma-dark text-white group-hover:bg-masuma-orange group-hover:scale-110 shadow-md hover:shadow-lg' 
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                }`}
                                title="Add to Cart"
                            >
                                <ShoppingBag size={18} />
                            </button>
                        </div>
                    </div>
                </div>
                </a>
            ))}
            </div>

            {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-2">
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    
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
                                className={`w-10 h-10 text-sm font-bold rounded transition ${
                                    currentPage === pNum 
                                    ? 'bg-masuma-dark text-white' 
                                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {pNum}
                            </button>
                        );
                    })}

                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
            <div className="text-center mt-4 text-xs text-gray-500">
                Showing page {currentPage} of {totalPages} ({totalProducts} items)
            </div>
        </>
      )}
    </div>
  );
};

export default ProductList;
