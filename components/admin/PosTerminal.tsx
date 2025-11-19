
import React, { useState, useEffect, useRef } from 'react';
import { Search, Trash2, Plus, Minus, CreditCard, Printer, Save, CheckCircle, QrCode } from 'lucide-react';
import { Product } from '../../types';
import { PRODUCTS } from '../../constants';

interface PosItem extends Product {
    qty: number;
}

const PosTerminal: React.FC = () => {
    const [cart, setCart] = useState<PosItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastSale, setLastSale] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const addToCart = (product: Product) => {
        setCart(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (exists) {
                return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
            }
            return [...prev, { ...product, qty: 1 }];
        });
        setSearchTerm('');
        searchInputRef.current?.focus();
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(p => {
            if (p.id === id) return { ...p, qty: Math.max(1, p.qty + delta) };
            return p;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(p => p.id !== id));
    };

    const handleCompleteSale = async () => {
        setIsProcessing(true);
        try {
            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
            
            // Call Backend API
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer demo-admin-token' // Mock Auth
                },
                body: JSON.stringify({
                    items: cart.map(i => ({ 
                        productId: i.id, 
                        name: i.name, 
                        quantity: i.qty, 
                        price: i.price 
                    })),
                    totalAmount,
                    paymentMethod: 'CASH'
                })
            });

            const saleData = await response.json();
            if (response.ok) {
                setLastSale(saleData);
                setCart([]);
            } else {
                alert('Sale Failed: ' + saleData.error);
            }
        } catch (error) {
            alert('Network Error');
        } finally {
            setIsProcessing(false);
        }
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const filteredProducts = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    // SUCCESS / RECEIPT VIEW
    if (lastSale) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <div className="bg-white p-8 rounded shadow-lg border border-gray-200 w-96 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-masuma-dark mb-1">Sale Completed</h2>
                    <p className="text-gray-500 text-sm mb-6">Receipt #{lastSale.receiptNumber}</p>
                    
                    {/* KRA SECTION */}
                    <div className="bg-gray-50 p-4 border border-gray-200 rounded mb-6 text-left">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">KRA Control Code</span>
                            <span className="text-xs font-mono font-bold">{lastSale.kraControlCode || 'PENDING'}</span>
                        </div>
                        <div className="flex justify-center py-2">
                             <QrCode size={64} className="text-masuma-dark" />
                        </div>
                        <p className="text-[9px] text-center text-gray-400">Scan to verify on iTax</p>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => window.print()} className="flex-1 bg-gray-800 text-white py-2 rounded font-bold text-sm uppercase flex items-center justify-center gap-2">
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={() => setLastSale(null)} className="flex-1 bg-masuma-orange text-white py-2 rounded font-bold text-sm uppercase">
                            New Sale
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-transparent focus:bg-white focus:border-masuma-orange outline-none rounded"
                            placeholder="Scan barcode or search SKU / Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {searchTerm ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => addToCart(p)}
                                    className="p-3 border border-gray-200 hover:border-masuma-orange cursor-pointer rounded bg-gray-50 hover:bg-white transition group"
                                >
                                    <div className="text-xs font-bold text-gray-500 mb-1">{p.sku}</div>
                                    <div className="font-bold text-sm text-masuma-dark line-clamp-2 h-10 leading-tight">{p.name}</div>
                                    <div className="mt-2 text-masuma-orange font-bold">KES {p.price.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p>Start typing to search inventory</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Cart & Checkout */}
            <div className="w-96 flex flex-col bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-masuma-dark text-white border-b border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold uppercase tracking-wider">Current Sale</h3>
                    <span className="bg-masuma-orange px-2 py-1 text-xs rounded font-bold">{cart.length} Items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
                    {cart.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex justify-between items-center">
                            <div className="flex-1">
                                <div className="text-xs font-bold text-gray-800">{item.name}</div>
                                <div className="text-[10px] text-gray-500">{item.sku}</div>
                            </div>
                            <div className="flex items-center gap-3 mx-2">
                                <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-gray-100 hover:bg-gray-200 rounded"><Minus size={12} /></button>
                                <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-gray-100 hover:bg-gray-200 rounded"><Plus size={12} /></button>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-masuma-dark">{(item.price * item.qty).toLocaleString()}</div>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                    <div className="flex justify-between text-lg font-bold text-masuma-dark">
                        <span>Total</span>
                        <span>KES {total.toLocaleString()}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 uppercase text-xs">
                            <CreditCard size={16} /> Cash / M-Pesa
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded font-bold hover:bg-gray-900 uppercase text-xs">
                            <Save size={16} /> Save Quote
                        </button>
                    </div>
                    <button 
                        onClick={handleCompleteSale}
                        disabled={cart.length === 0 || isProcessing}
                        className="w-full flex items-center justify-center gap-2 bg-masuma-orange text-white py-4 rounded font-bold hover:bg-orange-600 uppercase tracking-widest shadow-lg disabled:opacity-50"
                    >
                        {isProcessing ? 'Processing KRA...' : <><Printer size={20} /> Complete Sale</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PosTerminal;
