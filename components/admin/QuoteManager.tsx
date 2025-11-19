
import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, XCircle, MoreHorizontal, ArrowRight, DollarSign, RefreshCw, Loader2, Send, Eye, Plane, ShoppingBag } from 'lucide-react';
import { Quote, QuoteStatus } from '../../types';
import { apiClient } from '../../utils/apiClient';
import QuoteDetailsModal from './QuoteDetailsModal';

const QuoteManager: React.FC = () => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [activeTab, setActiveTab] = useState<'ALL' | 'STANDARD' | 'SOURCING'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchQuotes = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/quotes');
            setQuotes(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Draft</span>;
            case 'SENT': return <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Sent</span>;
            case 'ACCEPTED': return <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Accepted</span>;
            case 'EXPIRED': return <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Expired</span>;
            default: return null;
        }
    };

    const filteredQuotes = quotes.filter(q => {
        const matchesTab = activeTab === 'ALL' || q.type === activeTab;
        const matchesSearch = q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (q.vin && q.vin.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesTab && matchesSearch;
    });

    return (
        <div className="h-full flex flex-col">
            <QuoteDetailsModal 
                quote={selectedQuote} 
                isOpen={!!selectedQuote} 
                onClose={() => setSelectedQuote(null)} 
                onUpdate={fetchQuotes} 
            />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Quotations</h2>
                    <p className="text-sm text-gray-500">Manage sales quotes and special sourcing requests.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchQuotes} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab('ALL')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide border-b-4 transition ${activeTab === 'ALL' ? 'border-masuma-orange text-masuma-orange bg-gray-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        All Quotes
                    </button>
                    <button 
                        onClick={() => setActiveTab('SOURCING')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide border-b-4 transition flex items-center justify-center gap-2 ${activeTab === 'SOURCING' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Plane size={16} className="transform -rotate-45" /> Special Imports
                        {quotes.filter(q => q.type === 'SOURCING' && q.status === 'DRAFT').length > 0 && (
                            <span className="bg-purple-600 text-white text-[10px] px-2 rounded-full">
                                {quotes.filter(q => q.type === 'SOURCING' && q.status === 'DRAFT').length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('STANDARD')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide border-b-4 transition flex items-center justify-center gap-2 ${activeTab === 'STANDARD' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        <ShoppingBag size={16} /> Standard Inquiries
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" 
                            placeholder="Search Quote #, Customer, or VIN..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {isLoading && quotes.length === 0 ? (
                        <div className="flex justify-center items-center h-64">
                             <Loader2 className="animate-spin text-masuma-orange" size={32} />
                        </div>
                    ) : (
                    <table className="w-full text-left">
                        <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Quote #</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Value</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredQuotes.map(quote => (
                                <tr key={quote.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedQuote(quote)}>
                                    <td className="px-6 py-4 font-mono font-bold text-masuma-dark">{quote.quoteNumber}</td>
                                    <td className="px-6 py-4">
                                        {quote.type === 'SOURCING' ? (
                                            <span className="flex items-center gap-1 text-purple-700 font-bold text-[10px] uppercase bg-purple-100 px-2 py-1 rounded w-fit">
                                                <Plane size={12} className="transform -rotate-45" /> Import
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-blue-600 font-bold text-[10px] uppercase bg-blue-50 px-2 py-1 rounded w-fit">
                                                <FileText size={12} /> Standard
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-700">{quote.customerName}</div>
                                        <div className="text-xs text-gray-500">{quote.date}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {quote.type === 'SOURCING' && quote.vin ? (
                                            <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded w-fit border border-gray-300">
                                                VIN: {quote.vin}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-500">{quote.itemsCount} items</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-bold">
                                        {quote.total > 0 ? `KES ${quote.total.toLocaleString()}` : <span className="text-gray-400 italic">Pending</span>}
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(quote.status)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => setSelectedQuote(quote)}
                                                className="p-2 text-gray-400 hover:text-masuma-orange transition bg-white border border-gray-200 rounded"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredQuotes.length === 0 && (
                                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No quotes found matching your filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuoteManager;
