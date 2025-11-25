import React, { useState } from 'react';
import { Search, ShoppingBag, Plane, ArrowRight, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { Product } from '../types';
import Price from './Price';
import SourcingModal from './SourcingModal';

interface PartFinderProps {
    addToCart: (product: Product) => void;
}

const PartFinder: React.FC<PartFinderProps> = ({ addToCart }) => {
    const [sku, setSku] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundProduct, setFoundProduct] = useState<Product | null>(null);
    const [searchAttempted, setSearchAttempted] = useState(false);
    const [isSourcingOpen, setIsSourcingOpen] = useState(false);

    const handleLocalCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sku.trim()) return;
        
        setLoading(true);
        setSearchAttempted(false);
        setFoundProduct(null);
        
        try {
            const res = await apiClient.get(`/products?q=${sku}`);
            // FIX: Handle pagination
            const products = res.data.data || res.data || [];
            
            if (products && products.length > 0) {
                // Prioritize exact SKU match
                const exact = products.find((p: any) => p.sku.toLowerCase() === sku.toLowerCase());
                setFoundProduct(exact || products[0]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setSearchAttempted(true);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white animate-fade-in">
            <SourcingModal isOpen={isSourcingOpen} onClose={() => setIsSourcingOpen(false)} />

            {/* 1. Top Control Bar: Local Search */}
            <div className="bg-masuma-dark text-white py-8 border-b-4 border-masuma-orange">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold font-display uppercase tracking-wide mb-1">Part Finder</h1>
                        <p className="text-sm text-gray-400">
                            Step 1: Find your part number below. <br/> 
                            Step 2: Enter the SKU here to check local stock.
                        </p>
                    </div>
                    
                    <div className="w-full md:w-1/2 relative">
                        <form onSubmit={handleLocalCheck} className="flex shadow-lg">
                            <input 
                                type="text" 
                                value={sku}
                                onChange={e => setSku(e.target.value)}
                                placeholder="Enter SKU (e.g. MFC-112)"
                                className="flex-1 p-4 text-masuma-dark font-bold outline-none rounded-l-sm"
                            />
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="bg-masuma-orange hover:bg-white hover:text-masuma-orange text-white font-bold px-6 py-4 uppercase tracking-widest rounded-r-sm transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                                Check Stock
                            </button>
                        </form>

                        {/* Search Result Dropdown */}
                        {searchAttempted && (
                            <div className="absolute top-full left-0 w-full bg-white text-masuma-dark shadow-2xl border-x border-b border-gray-200 z-50 p-4 mt-1 animate-slide-up rounded-b-sm">
                                {foundProduct ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-200">
                                            <img src={foundProduct.image} alt={foundProduct.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm uppercase text-green-600 flex items-center gap-1">
                                                <CheckCircle size={14} /> Stock Found!
                                            </h4>
                                            <p className="font-bold text-masuma-dark">{foundProduct.name}</p>
                                            <p className="text-xs text-gray-500">SKU: {foundProduct.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-masuma-orange text-lg"><Price amount={foundProduct.price} /></p>
                                            <button 
                                                onClick={() => addToCart(foundProduct)}
                                                className="mt-1 bg-masuma-dark text-white px-4 py-2 text-xs font-bold uppercase rounded hover:bg-masuma-orange transition flex items-center gap-2"
                                            >
                                                <ShoppingBag size={14} /> Add
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-red-500">
                                            <XCircle size={20} />
                                            <div>
                                                <p className="font-bold text-sm uppercase">Not in Local Stock</p>
                                                <p className="text-xs text-gray-500">SKU "{sku}" not found in Nairobi warehouse.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setIsSourcingOpen(true)}
                                            className="bg-masuma-orange/10 text-masuma-orange border border-masuma-orange px-4 py-2 text-xs font-bold uppercase rounded hover:bg-masuma-orange hover:text-white transition flex items-center gap-2"
                                        >
                                            <Plane size={14} className="transform -rotate-45" /> Import It
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Warning Banner */}
            <div className="bg-gray-100 py-2 text-center border-b border-gray-200">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
                    <ExternalLink size={12} />
                    You are viewing the Global Masuma Catalog. Use it to find part numbers, then search above to buy locally.
                </p>
            </div>

            {/* 3. Embedded Iframe */}
            <div className="flex-1 relative w-full bg-gray-50">
                <iframe 
                    src="https://masuma.parts/" 
                    className="w-full h-full min-h-[800px] border-none"
                    title="Masuma Global Catalog"
                    loading="lazy"
                ></iframe>
            </div>
        </div>
    );
};

export default PartFinder;