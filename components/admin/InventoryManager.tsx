
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
    // Allow quantity to be string or number for better typing experience
    const [adjustment, setAdjustment] = useState<{quantity: string | number, operation: 'add' | 'subtract' | 'set'}>({ quantity: '', operation: 'add' });
    const [isTransferMode, setIsTransferMode] = useState(false);
    const [transferData, setTransferData] = useState<{toBranchId: string, quantity: string | number}>({ toBranchId: '', quantity: '' });
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
        setAdjustment({ quantity: '', operation: 'add' });
    };

    const handleTransfer = (item: StockItem) => {
        setSelectedItem(item);
        setIsTransferMode(true);
        setTransferData({ toBranchId: '', quantity: '' });
    };

    const saveAdjustment = async () => {
        if (!selectedItem) return;
        const qty = Number(adjustment.quantity);
        if (qty < 0) return;
        
        setIsSaving(true);
        try {
            await apiClient.patch(`/inventory/${selectedItem.product.id}`, {
                branchId: selectedItem.branch.id,
                quantity: qty,
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
        if (!selectedItem || !transferData.toBranchId) return;
        const qty = Number(transferData.quantity);
        if (qty <= 0) return;

        setIsSaving(true);
        try {
            await apiClient.post('/inventory/transfer', {
                productId: selectedItem.product.id,
                fromBranchId: selectedItem.branch.id,
                toBranchId: transferData.toBranchId,
                quantity: qty
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

    const cleanNumber = (str: any) => {
        if (str === null || str === undefined || str === '') return 0;
        const clean = String(str).replace(/[^\d.-]/g, '');
        if (clean === '') return 0;
        const num = parseFloat(clean);
        return (typeof num === 'number' && isFinite(num)) ? num : 0;
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
                    const quantity = Math.floor(cleanNumber(qtyStr));

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

                // Use the product manager bulk endpoint since it handles stock creation too
                await apiClient.post('/products/bulk', {
                    branchId: targetBranchId,
                    products
                });

                alert("Stock Import Successful!");
                fetchData();
            } catch (error: any) {
                console.error(error);
                alert('Import Failed: ' + (error.response?.data?.error || error.message));
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Stock Management</h2>
                    <p className="text-sm text-gray-500">Monitor stock levels, transfer items, and perform audits.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleImportFile}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded font-bold uppercase text-xs hover:bg-gray-50 flex items-center gap-2"
                        >
                            {isImporting ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16} />} Import Stock
                        </button>
                    </div>
                    <button onClick={fetchData} className="text-masuma-orange hover:bg-orange-50 px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition">
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>
            </div>

            {/* Modals */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-scale-up">
                        <div className="bg-masuma-dark text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold uppercase tracking-wider">
                                {isTransferMode ? 'Transfer Stock' : 'Adjust Stock'}
                            </h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 uppercase font-bold">Product</p>
                                <p className="font-bold text-lg text-masuma-dark">{selectedItem.product.name}</p>
                                <p className="text-xs font-mono text-gray-500">{selectedItem.product.sku}</p>
                            </div>
                            
                            <div className="mb-6 bg-gray-50 p-3 rounded border border-gray-200">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current Location</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold">{selectedItem.branch.name}</span>
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">{selectedItem.quantity} Available</span>
                                </div>
                            </div>

                            {isTransferMode ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Transfer To</label>
                                        <select 
                                            className="w-full p-2 border rounded focus:border-masuma-orange outline-none bg-white"
                                            value={transferData.toBranchId}
                                            onChange={e => setTransferData({...transferData, toBranchId: e.target.value})}
                                        >
                                            <option value="">Select Destination Branch</option>
                                            {branches.filter(b => b.id !== selectedItem.branch.id).map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Quantity to Move</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border rounded focus:border-masuma-orange outline-none"
                                            value={transferData.quantity}
                                            onChange={e => setTransferData({...transferData, quantity: e.target.value})}
                                            placeholder="0"
                                        />
                                    </div>
                                    <button 
                                        onClick={executeTransfer}
                                        disabled={isSaving}
                                        className="w-full bg-masuma-dark text-white py-3 rounded font-bold uppercase text-xs hover:bg-masuma-orange transition flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Truck size={16}/>} Confirm Transfer
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => setAdjustment({...adjustment, operation: 'add'})} className={`py-2 text-xs font-bold uppercase rounded border ${adjustment.operation === 'add' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-500'}`}>Add (+)</button>
                                        <button onClick={() => setAdjustment({...adjustment, operation: 'subtract'})} className={`py-2 text-xs font-bold uppercase rounded border ${adjustment.operation === 'subtract' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-500'}`}>Remove (-)</button>
                                        <button onClick={() => setAdjustment({...adjustment, operation: 'set'})} className={`py-2 text-xs font-bold uppercase rounded border ${adjustment.operation === 'set' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-500'}`}>Set (=)</button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Quantity</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border rounded focus:border-masuma-orange outline-none"
                                            value={adjustment.quantity}
                                            onChange={e => setAdjustment({...adjustment, quantity: e.target.value})}
                                            placeholder="0"
                                        />
                                    </div>
                                    <button 
                                        onClick={saveAdjustment}
                                        disabled={isSaving}
                                        className="w-full bg-masuma-dark text-white py-3 rounded font-bold uppercase text-xs hover:bg-masuma-orange transition flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Update Stock
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-masuma-orange" size={32} />
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3">Product</th>
                                    <th className="px-6 py-3">SKU</th>
                                    <th className="px-6 py-3">Branch</th>
                                    <th className="px-6 py-3">Stock Level</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stockItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-bold text-gray-800">{item.product.name}</td>
                                        <td className="px-6 py-3 font-mono text-xs text-masuma-dark">{item.product.sku}</td>
                                        <td className="px-6 py-3 text-gray-500 text-xs uppercase">{item.branch.name}</td>
                                        <td className="px-6 py-3">
                                            {item.quantity <= item.lowStockThreshold ? (
                                                <span className="flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase bg-red-50 px-2 py-1 rounded w-fit">
                                                    <AlertTriangle size={12} /> Low: {item.quantity}
                                                </span>
                                            ) : (
                                                <span className="text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-1 rounded">
                                                    {item.quantity} Units
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleAdjust(item)} className="p-2 border rounded hover:bg-gray-100 text-gray-600" title="Adjust">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleTransfer(item)} className="p-2 border rounded hover:bg-gray-100 text-gray-600" title="Transfer">
                                                    <ArrowRightLeft size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {stockItems.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">No inventory records found.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryManager;
