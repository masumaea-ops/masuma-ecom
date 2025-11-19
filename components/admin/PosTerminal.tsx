
import React, { useState, useRef } from 'react';
import { Search, Trash2, Plus, Minus, CreditCard, Printer, Save, CheckCircle, QrCode, User, X } from 'lucide-react';
import { Product, Customer } from '../../types';
import { PRODUCTS } from '../../constants';
import { apiClient } from '../../utils/apiClient';

interface PosItem extends Product {
    qty: number;
    appliedPrice: number; // Price after customer discount
}

const PosTerminal: React.FC = () => {
    const [cart, setCart] = useState<PosItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastSale, setLastSale] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [foundCustomers, setFoundCustomers] = useState<Customer[]>([]);
    
    const searchInputRef = useRef<HTMLInputElement>(null);

    // --- Cart Logic ---
    const addToCart = (product: Product) => {
        setCart(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (exists) {
                return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
            }
            // Apply Wholesale Price if customer is B2B
            const price = (customer?.isWholesale && product.wholesalePrice) 
                          ? product.wholesalePrice 
                          : product.price;

            return [...prev, { ...product, qty: 1, appliedPrice: price }];
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

    // --- Customer Search Logic ---
    const handleSearchCustomer = async (term: string) => {
        setCustomerSearchTerm(term);
        if (term.length > 2) {
            try {
                const res = await apiClient.get(`/customers?search=${term}`);
                setFoundCustomers(res.data);
            } catch (err) {
                console.error(err);
                // Mock Data Fallback
                setFoundCustomers([
                    { id: '1', name: 'AutoExpress Ltd', phone: '0722000000', isWholesale: true, totalSpend: 0, lastVisit: '' },
                    { id: '2', name: 'Walk-in Customer', phone: '0700000000', isWholesale: false, totalSpend: 0, lastVisit: '' }
                ]);
            }
        }
    };

    const selectCustomer = (c: Customer) => {
        setCustomer(c);
        setIsCustomerSearchOpen(false);
        
        // Recalculate prices in cart based on new customer status
        setCart(prev => prev.map(item => ({
            ...item,
            appliedPrice: (c.isWholesale && item.wholesalePrice) ? item.wholesalePrice : item.price
        })));
    };

    // --- Checkout Logic ---
    const handleCompleteSale = async () => {
        setIsProcessing(true);
        try {
            const totalAmount = cart.reduce((sum, item) => sum + (item.appliedPrice * item.qty), 0);
            
            const payload = {
                items: cart.map(i => ({ 
                    productId: i.id, 
                    name: i.name, 
                    quantity: i.qty, 
                    price: i.appliedPrice 
                })),
                totalAmount,
                paymentMethod: 'CASH',
                customerId: customer?.id
            };

            const response = await apiClient.post('/sales', payload);
            setLastSale(response.data);
            setCart([]);
            setCustomer(null); // Reset for next sale
        } catch (error) {
            alert('Sale Failed: Network Error');
        } finally {
            setIsProcessing(false);
        }
    };

    const total = cart.reduce((sum, item) => sum + (item.appliedPrice * item.qty), 0);

    const filteredProducts = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    // SUCCESS / RECEIPT VIEW
    if (lastSale) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)] animate-scale-up">
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
        <div className="flex h-[calc(100vh-100px)] gap-6 font-sans">
            {/* Left: Product Selection */}
            <div className="flex-1 flex flex-col bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex gap-4">
                    <div className="relative flex-1">
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
            <div className="w-96 flex flex-col bg-white rounded shadow-sm border border-gray-200 overflow-hidden relative">
                <div className="p-4 bg-masuma-dark text-white border-b border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold uppercase tracking-wider">Current Sale</h3>
                    <span className="bg-masuma-orange px-2 py-1 text-xs rounded font-bold">{cart.length} Items</span>
                </div>

                {/* Customer Selector */}
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                    {!customer ? (
                        <button 
                            onClick={() => setIsCustomerSearchOpen(true)}
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-gray-500 text-xs font-bold uppercase hover:border-masuma-orange hover:text-masuma-orange transition flex items-center justify-center gap-2"
                        >
                            <User size={16} /> Select Customer
                        </button>
                    ) : (
                        <div className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded">
                             <div className="flex flex-col">
                                 <span className="text-xs font-bold text-masuma-dark">{customer.name}</span>
                                 {customer.isWholesale && <span className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded w-fit font-bold uppercase">Wholesale</span>}
                             </div>
                             <button onClick={() => { setCustomer(null); setIsCustomerSearchOpen(false); }} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                        </div>
                    )}
                </div>

                {/* Customer Search Dropdown */}
                {isCustomerSearchOpen && !customer && (
                    <div className="absolute top-[116px] left-0 w-full bg-white shadow-xl border-b border-gray-200 z-10 p-2 animate-slide-up">
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="Search Customer..."
                            className="w-full p-2 border border-gray-300 rounded text-sm mb-2"
                            value={customerSearchTerm}
                            onChange={(e) => handleSearchCustomer(e.target.value)}
                        />
                        <div className="max-h-40 overflow-y-auto space-y-1">
                            {foundCustomers.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => selectCustomer(c)}
                                    className="p-2 hover:bg-gray-100 cursor-pointer rounded text-sm flex justify-between"
                                >
                                    <span>{c.name}</span>
                                    {c.isWholesale && <span className="text-purple-600 text-xs font-bold">B2B</span>}
                                </div>
                            ))}
                            {foundCustomers.length === 0 && <p className="text-xs text-gray-400 text-center p-2">No results</p>}
                        </div>
                        <button onClick={() => setIsCustomerSearchOpen(false)} className="w-full text-center text-xs text-red-500 mt-2 py-1 hover:bg-red-50">Close</button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
                    {cart.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex justify-between items-center">
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
                                <div className="text-sm font-bold text-masuma-dark">{(item.appliedPrice * item.qty).toLocaleString()}</div>
                                {item.appliedPrice < (item.price || 0) && <div className="text-[9px] text-green-600 line-through decoration-gray-400">KES {(item.price || 0).toLocaleString()}</div>}
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
