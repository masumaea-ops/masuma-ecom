
import React, { useState } from 'react';
import { Package, ShoppingCart, Upload, FileText, Plus, Trash2, Download, Loader2, CheckCircle } from 'lucide-react';
import { PRODUCTS } from '../../constants';
import { apiClient } from '../../utils/apiClient';

const B2BPortal: React.FC = () => {
    const [orderItems, setOrderItems] = useState<{sku: string, qty: number}[]>([{ sku: '', qty: 1 }]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleAddItem = () => {
        setOrderItems([...orderItems, { sku: '', qty: 1 }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...orderItems];
        newItems.splice(index, 1);
        setOrderItems(newItems);
    };

    const updateItem = (index: number, field: 'sku' | 'qty', value: string | number) => {
        const newItems = [...orderItems];
        if (field === 'qty') newItems[index].qty = Number(value);
        else newItems[index].sku = String(value).toUpperCase();
        setOrderItems(newItems);
    };

    const calculateTotal = () => {
        let total = 0;
        orderItems.forEach(item => {
            const product = PRODUCTS.find(p => p.sku === item.sku);
            if (product) {
                const price = product.price * 0.85; // Wholesale price
                total += price * item.qty;
            }
        });
        return total;
    };

    const handlePlaceOrder = async () => {
        // Validate items
        const validItems = orderItems.filter(i => i.sku && i.qty > 0);
        if (validItems.length === 0) return alert("Please add at least one valid item.");

        // Map SKUs to Product IDs (In a real app, this lookup would happen against the live DB)
        // For now we map against constant PRODUCTS to find IDs
        const payloadItems = validItems.map(item => {
            const product = PRODUCTS.find(p => p.sku === item.sku);
            if (!product) return null;
            return {
                productId: product.id,
                quantity: item.qty,
                price: product.price * 0.85 // Lock in the price
            };
        }).filter(Boolean);

        if (payloadItems.length === 0) return alert("No valid products found for entered SKUs.");

        setIsSubmitting(true);
        try {
            const userStr = localStorage.getItem('masuma_user');
            const user = userStr ? JSON.parse(userStr) : { name: 'Admin User', email: 'admin@masuma.africa' };

            await apiClient.post('/orders', {
                customerName: user.name || 'Wholesale Partner',
                customerEmail: user.email,
                customerPhone: '0700000000', // Placeholder or prompt user
                items: payloadItems,
                paymentMethod: 'B2B_CREDIT'
            });

            setSuccessMessage('Order placed successfully!');
            setOrderItems([{ sku: '', qty: 1 }]);
            setTimeout(() => setSuccessMessage(''), 5000);

        } catch (error) {
            console.error(error);
            alert('Failed to place order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">B2B Wholesale Portal</h2>
                    <p className="text-sm text-gray-500">Bulk ordering for Garages and Fleet Partners.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded font-bold uppercase text-xs hover:bg-gray-50 flex items-center gap-2">
                        <Upload size={16} /> Upload CSV
                    </button>
                    <button className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded font-bold uppercase text-xs hover:bg-gray-50 flex items-center gap-2">
                        <Download size={16} /> Price List
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
                    <CheckCircle size={20} /> {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Order Form */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-masuma-dark uppercase text-sm">Quick Order Entry</h3>
                        <button onClick={handleAddItem} className="text-masuma-orange hover:text-masuma-dark font-bold text-xs uppercase flex items-center gap-1">
                            <Plus size={14} /> Add Row
                        </button>
                    </div>
                    
                    <div className="p-4 flex-1 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs text-gray-400 font-bold uppercase border-b border-gray-100">
                                <tr>
                                    <th className="pb-2 pl-2">Part Number (SKU)</th>
                                    <th className="pb-2">Product Name</th>
                                    <th className="pb-2">Stock</th>
                                    <th className="pb-2 w-24">Qty</th>
                                    <th className="pb-2 text-right">Total (KES)</th>
                                    <th className="pb-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orderItems.map((item, index) => {
                                    const product = PRODUCTS.find(p => p.sku === item.sku);
                                    return (
                                        <tr key={index} className="group">
                                            <td className="py-2">
                                                <input 
                                                    type="text" 
                                                    value={item.sku}
                                                    onChange={(e) => updateItem(index, 'sku', e.target.value)}
                                                    className="w-full p-2 border border-gray-200 rounded font-mono text-sm uppercase focus:border-masuma-orange outline-none"
                                                    placeholder="e.g. MFC-112"
                                                />
                                            </td>
                                            <td className="py-2 text-sm font-bold text-gray-600">
                                                {product ? product.name : <span className="text-gray-300 italic">Enter valid SKU</span>}
                                            </td>
                                            <td className="py-2 text-xs">
                                                {product ? (
                                                    product.stock ? <span className="text-green-600">In Stock</span> : <span className="text-red-500">Out</span>
                                                ) : '-'}
                                            </td>
                                            <td className="py-2">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(index, 'qty', e.target.value)}
                                                    className="w-full p-2 border border-gray-200 rounded text-center outline-none focus:border-masuma-orange"
                                                />
                                            </td>
                                            <td className="py-2 text-right font-bold text-masuma-dark text-sm">
                                                {product ? (product.price * 0.85 * item.qty).toLocaleString() : '-'}
                                            </td>
                                            <td className="py-2 text-center">
                                                <button onClick={() => handleRemoveItem(index)} className="text-gray-300 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-masuma-dark text-white rounded-lg shadow-lg p-6 flex flex-col">
                    <h3 className="font-bold text-lg uppercase tracking-wider mb-6 border-b border-gray-700 pb-2">Order Summary</h3>
                    
                    <div className="space-y-4 mb-auto">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Items Count</span>
                            <span>{orderItems.length}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Subtotal (Retail)</span>
                            <span className="line-through decoration-red-500">KES {orderItems.reduce((acc, i) => {
                                const p = PRODUCTS.find(pr => pr.sku === i.sku);
                                return acc + (p ? p.price * i.qty : 0);
                            }, 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-masuma-orange font-bold">
                            <span>Wholesale Discount (15%)</span>
                            <span>Applied</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4 mt-6">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-gray-400 uppercase text-xs font-bold">Total Payable</span>
                            <span className="text-3xl font-bold">KES {calculateTotal().toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-6 text-right">Inclusive of VAT</p>
                        
                        <button 
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting}
                            className="w-full bg-masuma-orange hover:bg-white hover:text-masuma-orange text-white font-bold py-4 uppercase tracking-widest rounded transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
                            {isSubmitting ? 'Processing...' : 'Place Bulk Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default B2BPortal;
