import React, { useState, useEffect, useRef } from 'react';
import { Edit, AlertTriangle, Package, Loader2, RefreshCw, Plus, Minus, Save, X, ArrowRightLeft, Truck, Upload, Download } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { Branch } from '../../types';

interface StockItem {
    id: string;
    product: {
        id: string;
        name: string;
        sku: string;
    };
    branch: {
        id: string;
        name: string;
    };
    quantity: number;
    lowStockThreshold: number;
}

const InventoryManager: React.FC = () => {
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [adjustment, setAdjustment] = useState({ quantity: 0, operation: 'add' as 'add' | 'subtract' | 'set' });
    const [isTransferMode, setIsTransferMode] = useState(false);
    const [transferData, setTransferData] = useState({ toBranchId: '', quantity: 0 });
    const [isSaving, setIsSaving] = useState(false);
    
    // Import States
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [stockRes, branchRes] = await Promise.all([
                apiClient.get('/inventory'),
                apiClient.get('/branches')
            ]);
            setStockItems(stockRes.data);
            setBranches(branchRes.data);
        } catch (error) {
             // Fallback
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdjust = (item: StockItem) => {
        setSelectedItem(item);
        setIsTransferMode(false);
        setAdjustment({ quantity: 0, operation: 'add' });
    };

    const handleTransfer = (item: StockItem) => {
        setSelectedItem(item);
        setIsTransferMode(true);
        setTransferData({ toBranchId: '', quantity: 0 });
    };

    const saveAdjustment = async () => {
        if (!selectedItem || adjustment.quantity < 0) return;
        
        setIsSaving(true);
        try {
            await apiClient.patch(`/inventory/${selectedItem.product.id}`, {
                branchId: selectedItem.branch.id,
                quantity: Number(adjustment.quantity),
                operation: adjustment.operation
            });
            setSelectedItem(null);
            fetchData();
        } catch (error) {
            alert('Failed to update stock');
        } finally {
            setIsSaving(false);
        }
    };

    const executeTransfer = async () => {
        if (!selectedItem || transferData.quantity <= 0 || !transferData.toBranchId) return;
        setIsSaving(true);
        try {
            await apiClient.post('/inventory/transfer', {
                productId: selectedItem.product.id,
                fromBranchId: selectedItem.branch.id,
                toBranchId: transferData.toBranchId,
                quantity: Number(transferData.quantity)
            });
            setSelectedItem(null);
            alert('Transfer successful');
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Transfer failed');
        } finally {
            setIsSaving(false);
        }
    };

    // --- ROBUST CSV HELPER ---
    const parseCSVLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuote = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        return result;
    };

    const cleanNumber = (str: string) => {
        if (!str) return 0;
        const clean = str.replace(/[^\d.-]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        
        reader.onload = async (evt) => {
            const text = evt.target?.result as string;
            const lines = text.split('\n');
            if (lines.length < 2) {
                alert("CSV file is empty.");
                setIsImporting(false);
                return;
            }

            // Robust Header Mapping
            const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

            // Helper to find column index with flexible matching and strict exclusions
            const getColumnIndex = (candidates: string[], exclusions: string[] = []) => {
                return headers.findIndex(h => {
                    const matchesCandidate = candidates.some(c => h.includes(c));
                    // Ensure it doesn't contain any excluded terms (e.g. 'cost' when searching for 'price')
                    const matchesExclusion = exclusions.some(e => h.includes(e));
                    return matchesCandidate && !matchesExclusion;
                });
            };

            const products = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = parseCSVLine(lines[i]);
                
                const getRawValue = (candidates: string[], exclusions: string[] = []) => {
                    const idx = getColumnIndex(candidates, exclusions);
                    if (idx === -1) return '';
                    let val = values[idx] || '';
                    return val.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
                };

                // Data Extraction using flexible headers
                const sku = getRawValue(['sku', 'part no', 'code', 'part_number']);
                
                if (sku) {
                    const name = getRawValue(['name', 'product', 'description', 'item', 'title']) || 'Imported Stock';
                    const category = getRawValue(['category', 'group', 'cat']) || 'General';
                    
                    // Price Logic: Look for 'retail', 'selling', or 'price' but avoid 'cost'/'wholesale'
                    const priceStr = getRawValue(['retail', 'selling', 'price', 'srp', 'amount'], ['cost', 'wholesale', 'trade', 'buying']);
                    const price = cleanNumber(priceStr);

                    // Cost Price
                    const costStr = getRawValue(['cost', 'buying', 'purchase']);
                    const costPrice = cleanNumber(costStr);

                    // Wholesale Price
                    const wholesaleStr = getRawValue(['wholesale', 'trade', 'dealer']);
                    const wholesalePrice = cleanNumber(wholesaleStr);

                    // Quantity
                    const qtyStr = getRawValue(['qty', 'quantity', 'stock', 'count', 'inventory', 'on hand']);
                    const quantity = parseInt(String(cleanNumber(qtyStr)));

                    // OEM
                    const oemNumbers = getRawValue(['oem', 'cross', 'ref', 'original']);

                    products.push({
                        sku,
                        name,
                        category,
                        price,
                        costPrice,
                        wholesalePrice,
                        quantity,
                        oemNumbers
                    });
                }
            }

            try {
                const targetBranchId = branches[0]?.id; 
                if (!targetBranchId) throw new Error("No branch available");

                if (products.length === 0) {
                    throw new Error("No valid products found in CSV. Check headers (SKU is required).");
                }

                await apiClient.post('/products/bulk', {
                    branchId: targetBranchId,
                    products
                });
                alert(`Successfully processed ${products.length} items.`);
                fetchData();
            } catch (error: any) {
                alert('Import failed: ' + (error.response?.data?.error || error.message));
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        
        reader.readAsText(file);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col relative">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-masuma-dark flex items-center gap-2 uppercase font-display">
                    <Package className="text-masuma-orange" />
                    Inventory Management
                </h2>
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImportFile} />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="px-4 py-2 border border-gray-300 rounded font-bold uppercase text-xs hover:bg-gray-50 text-gray-600 flex items-center gap-2"
                    >
                        {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Import CSV
                    </button>
                    <button onClick={fetchData} className="p-2 bg-gray-100 rounded hover:bg-gray-200" title="Refresh">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-x-auto">
                {isLoading && stockItems.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-masuma-orange" size={32} />
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                            <tr>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">SKU</th>
                                <th className="px-6 py-4">Branch</th>
                                <th className="px-6 py-4">Quantity</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stockItems.map((item, index) => (
                                <tr key={item.id || index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-800">{item.product.name}</td>
                                    <td className="px-6 py-4 font-mono text-gray-500">{item.product.sku}</td>
                                    <td className="px-6 py-4">{item.branch.name}</td>
                                    <td className="px-6 py-4 font-bold">{item.quantity}</td>
                                    <td className="px-6 py-4">
                                        {item.quantity <= item.lowStockThreshold ? (
                                            <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                                <AlertTriangle size={12} /> Low Stock
                                            </span>
                                        ) : (
                                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold uppercase">Good</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleAdjust(item)}
                                                className="text-gray-600 hover:text-masuma-dark font-bold uppercase text-[10px] bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                <Edit size={12} /> Adjust
                                            </button>
                                            <button 
                                                onClick={() => handleTransfer(item)}
                                                className="text-masuma-orange hover:text-white hover:bg-masuma-orange font-bold uppercase text-[10px] border border-masuma-orange px-2 py-1 rounded flex items-center gap-1 transition"
                                            >
                                                <ArrowRightLeft size={12} /> Transfer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {stockItems.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No inventory records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {selectedItem && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl w-96 overflow-hidden animate-scale-up">
                        <div className="bg-masuma-dark text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-wider">{isTransferMode ? 'Transfer Stock' : 'Adjust Stock'}</h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 text-center">
                                <h4 className="font-bold text-lg text-masuma-dark">{selectedItem.product.name}</h4>
                                <p className="text-sm text-gray-500 mb-2">Current: <span className="font-bold text-black">{selectedItem.quantity}</span> units at {selectedItem.branch.name}</p>
                            </div>
                            
                            {!isTransferMode ? (
                                <>
                                    <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded">
                                        {['add', 'subtract', 'set'].map(op => (
                                            <button 
                                                key={op}
                                                onClick={() => setAdjustment({...adjustment, operation: op as any})}
                                                className={`flex-1 py-2 text-xs font-bold uppercase rounded transition ${
                                                    adjustment.operation === op ? 'bg-white text-masuma-orange shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                {op}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mb-6">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={adjustment.quantity}
                                            onChange={e => setAdjustment({...adjustment, quantity: parseInt(e.target.value) || 0})}
                                            className="w-full p-3 border-2 border-gray-200 rounded focus:border-masuma-orange outline-none text-xl font-bold text-center"
                                        />
                                    </div>
                                    <button onClick={saveAdjustment} disabled={isSaving} className="w-full bg-masuma-dark text-white py-3 rounded font-bold uppercase tracking-widest hover:bg-masuma-orange transition flex items-center justify-center gap-2">
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Update
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Destination Branch</label>
                                            <select 
                                                className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none bg-white"
                                                value={transferData.toBranchId}
                                                onChange={e => setTransferData({...transferData, toBranchId: e.target.value})}
                                            >
                                                <option value="">Select Branch...</option>
                                                {branches.filter(b => b.id !== selectedItem.branch.id).map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Quantity to Transfer</label>
                                            <input 
                                                type="number" 
                                                min="1"
                                                max={selectedItem.quantity}
                                                value={transferData.quantity}
                                                onChange={e => setTransferData({...transferData, quantity: parseInt(e.target.value) || 0})}
                                                className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none"
                                            />
                                        </div>
                                    </div>
                                    <button onClick={executeTransfer} disabled={isSaving} className="w-full bg-masuma-orange text-white py-3 rounded font-bold uppercase tracking-widest hover:bg-orange-600 transition flex items-center justify-center gap-2">
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Truck size={18} />} Confirm Transfer
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManager;