
import React, { useState, useMemo, useEffect } from 'react';
import { Category, Product } from '../types';
import { PRODUCTS as STATIC_PRODUCTS } from '../constants';
import { Search, AlertCircle, Eye, ShoppingBag, RefreshCw, Plane } from 'lucide-react';
import QuickView from './QuickView';
import VinSearch from './VinSearch';
import { apiClient } from '../utils/apiClient';
import Price from './Price';
import SourcingModal from './SourcingModal';

interface ProductListProps {
  addToCart: (product: Product, quantity?: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({ addToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [vinFilter, setVinFilter] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  
  const [isSourcingOpen, setIsSourcingOpen] = useState(false);

  // Fetch Products with Server-Side Search
  useEffect(() => {
    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            // Construct query params
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (selectedCategory !== Category.ALL) params.append('category', selectedCategory);
            
            const response = await apiClient.get(`/products?${params.toString()}`);
            
            if (response.data && Array.isArray(response.data)) {
                setProducts(response.data);
                setUsingFallback(false);
            } else {
                throw new Error('Invalid data');
            }
        } catch (error) {
            // Quietly switch to fallback if server fails
            console.warn('Backend API unreachable. Switching to offline catalog.');
            setProducts(STATIC_PRODUCTS);
            setUsingFallback(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce the API call for search
    const timer = setTimeout(() => {
        fetchProducts();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]); // Re-run when search or category changes

  // Client-side fallback filtering (only used if usingFallback is true OR for VIN filtering on top of results)
  const displayProducts = useMemo(() => {
    let filtered = products;

    if (usingFallback) {
        filtered = products.filter(product => {
            const query = searchQuery.toLowerCase().trim();
            const matchesCategory = selectedCategory === Category.ALL || product.category === selectedCategory;
            
            if (!query) return matchesCategory;

            const matchesName = product.name.toLowerCase().includes(query);
            const matchesSku = product.sku.toLowerCase().includes(query);
            const matchesOem = product.oemNumbers.some(oem => 
                oem.toLowerCase().replace(/[-\s]/g, '').includes(query.replace(/[-\s]/g, '')) || 
                oem.toLowerCase().includes(query)
            );
            const matchesCompat = product.compatibility.some(c => c.toLowerCase().includes(query));

            return matchesCategory && (matchesName || matchesSku || matchesOem || matchesCompat);
        });
    }

    // VIN Filtering is always client-side for now (decodes to a car model string)
    if (vinFilter) {
        filtered = filtered.filter(product => 
            product.compatibility.some(c => c.toLowerCase().includes(vinFilter.toLowerCase()) || vinFilter.toLowerCase().includes(c.toLowerCase()))
        );
    }

    return filtered;
  }, [selectedCategory, searchQuery, vinFilter, products, usingFallback]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <QuickView 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        addToCart={addToCart}
      />
      <SourcingModal isOpen={isSourcingOpen} onClose={() => setIsSourcingOpen(false)} />

      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-end">
        <div>
            <h2 className="text-3xl md:text-4xl font-bold text-masuma-dark mb-2 font-display uppercase tracking-tight">Parts Catalog</h2>
            <div className="h-1.5 w-24 bg-masuma-orange mb-4 mx-auto md:mx-0"></div>
            <p className="text-gray-600 max-w-2xl">
            Browse our extensive inventory of genuine Masuma parts. Engineered in Japan, proven in Kenya.
            </p>
        </div>
        {usingFallback && (
            <div className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded border border-orange-200 flex items-center gap-2 mt-4 md:mt-0 animate-fade-in">
                <AlertCircle size={12} /> Offline Mode: Showing Local Catalog
            </div>
        )}
      </div>

      {/* VIN Search Module */}
      <VinSearch onVehicleIdentified={setVinFilter} />

      {/* Controls */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md p-4 shadow-lg border-t-4 border-masuma-orange mb-8 -mx-4 sm:mx-0 sm:rounded-lg transition-all">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          {/* Search */}
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

          {/* Filter */}
          <div className="w-full lg:w-2/3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-1">
              {Object.values(Category).map((cat) => (
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

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
           {[1,2,3,4,5,6,7,8].map(i => <ProductSkeleton key={i} />)}
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center">
          <div className="inline-flex p-6 bg-white rounded-full shadow-sm mb-6">
            <AlertCircle className="text-masuma-orange" size={48} />
          </div>
          <h3 className="text-2xl font-bold text-masuma-dark font-display">Part Not Found</h3>
          <p className="text-gray-500 max-w-md mx-auto mt-2 mb-8">
            We couldn't find a match for "{searchQuery}" {vinFilter && `compatible with ${vinFilter}`}.
            However, we can source it directly from Masuma Japan for you.
          </p>
          
          <div className="flex gap-4">
              <button 
                onClick={() => {setSearchQuery(''); setSelectedCategory(Category.ALL); setVinFilter('');}}
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {displayProducts.map((product) => (
            <div key={product.id} className="group bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full relative overflow-hidden rounded-sm">
              
              {/* Image Area */}
              <div className="relative h-64 bg-gray-50 p-6 flex items-center justify-center overflow-hidden border-b border-gray-100">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="max-w-full max-h-full object-contain transform group-hover:scale-110 transition duration-700 ease-out"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Masuma+Part';
                  }}
                />
                
                {/* Floating Badges */}
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

                {/* Quick Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]">
                    <button 
                        onClick={() => setSelectedProduct(product)}
                        className="bg-white text-masuma-dark hover:text-masuma-orange px-6 py-3 font-bold uppercase text-xs tracking-widest flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition duration-300 shadow-lg"
                    >
                        <Eye size={16} /> Quick View
                    </button>
                </div>
              </div>

              {/* Details Area */}
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
                        <p className="text-xs text-gray-700 line-clamp-1" title={product.compatibility.join(', ')}>
                            {product.compatibility.join(', ')}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div>
                            <span className="text-lg font-bold text-masuma-dark">
                                <Price amount={product.price} />
                            </span>
                        </div>
                        <button
                            onClick={() => addToCart(product)}
                            disabled={!product.stock}
                            className={`p-3 rounded-full transition-colors duration-300 ${
                                product.stock 
                                ? 'bg-masuma-dark text-white hover:bg-masuma-orange shadow-md hover:shadow-lg' 
                                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            }`}
                            title="Add to Cart"
                        >
                            <ShoppingBag size={18} />
                        </button>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;
