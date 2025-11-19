
import React, { useState, useEffect } from 'react';
import { X, Check, Send, Printer, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Quote, QuoteStatus } from '../../types';
import { apiClient } from '../../utils/apiClient';

interface QuoteDetailsModalProps {
    quote: Quote | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

const QuoteDetailsModal: React.FC<QuoteDetailsModalProps> = ({ quote, isOpen, onClose, onUpdate }) => {
    const [items, setItems] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (quote) {
            setItems(quote.items || []);
        }
    }, [quote]);

    if (!isOpen || !quote) return null;

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        // Recalc total
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
        setItems(newItems);
    };

    const calculateGrandTotal = () => {
        return items.reduce((acc, item) => acc + (item.total || 0), 0);
    };

    const handleSave = async (newStatus?: QuoteStatus) => {
        setIsSaving(true);
        try {
            const payload: any = {
                items: items,
                total: calculateGrandTotal()
            };
            if (newStatus) payload.status = newStatus;

            await apiClient.patch(`/quotes/${quote.id}`, payload);
            onUpdate();
            if (newStatus) onClose(); // Close if status change
        } catch (error) {
            alert('Failed to save quote');
        } finally {
            setIsSaving(false);
        }
    };

    const isEditable = quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.SENT;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                {/* Header */}
                <div className="bg-masuma-dark text-white p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold font-display uppercase tracking-wider">Quote #{quote.quoteNumber}</h2>
                        <p className="text-gray-400 text-sm">Created on {quote.date}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X size={24} /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {/* Status Banner */}
                    {quote.status === QuoteStatus.DRAFT && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded text-xs mb-6 flex items-center gap-2">
                            <AlertCircle size={16} />
                            This quote is in DRAFT. You can edit prices before sending to the customer.
                        </div>
                    )}

                    <div className="bg-white p-4 rounded shadow-sm border border-gray-200 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Customer</p>
                                <p className="font-bold text-gray-800">{quote.customerName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-500 uppercase">Quote Value</p>
                                <p className="font-bold text-masuma-orange text-lg">KES {calculateGrandTotal().toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3 w-20 text-center">Qty</th>
                                    <th className="px-4 py-3 w-32 text-right">Unit Price</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-3">
                                            <input 
                                                type="text" 
                                                value={item.name}
                                                disabled={!isEditable}
                                                onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                                className="w-full p-1 border-b border-transparent focus:border-masuma-orange outline-none disabled:bg-transparent"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                             <input 
                                                type="number" 
                                                value={item.quantity}
                                                disabled={!isEditable}
                                                onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                className="w-full p-1 text-center border border-gray-200 rounded focus:border-masuma-orange outline-none disabled:bg-transparent disabled:border-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                             <input 
                                                type="number" 
                                                value={item.unitPrice}
                                                disabled={!isEditable}
                                                onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                                                className="w-full p-1 text-right border border-gray-200 rounded focus:border-masuma-orange outline-none font-mono disabled:bg-transparent disabled:border-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold">
                                            {item.total.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 bg-white flex justify-between items-center">
                    <button className="text-gray-500 hover:text-masuma-dark text-xs font-bold uppercase flex items-center gap-2">
                        <Printer size={16} /> Print Quote
                    </button>
                    
                    <div className="flex gap-3">
                        {isEditable && (
                            <button 
                                onClick={() => handleSave()}
                                disabled={isSaving}
                                className="bg-white border border-masuma-dark text-masuma-dark px-4 py-2 rounded font-bold uppercase text-xs hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Save size={16} /> Save
                            </button>
                        )}
                        
                        {quote.status === QuoteStatus.DRAFT && (
                             <button 
                                onClick={() => handleSave(QuoteStatus.SENT)}
                                className="bg-blue-600 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-blue-700 flex items-center gap-2"
                             >
                                <Send size={16} /> Send to Customer
                             </button>
                        )}

                        {quote.status === QuoteStatus.SENT && (
                             <button 
                                onClick={() => handleSave(QuoteStatus.ACCEPTED)}
                                className="bg-green-600 text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-green-700 flex items-center gap-2"
                             >
                                <Check size={16} /> Accept & Invoice
                             </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuoteDetailsModal;
