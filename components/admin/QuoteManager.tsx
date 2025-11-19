
import React, { useState } from 'react';
import { Search, FileText, CheckCircle, XCircle, MoreHorizontal, ArrowRight, DollarSign } from 'lucide-react';
import { QuoteStatus } from '../../types';

interface MockQuote {
    id: string;
    quoteNumber: string;
    customerName: string;
    date: string;
    total: number;
    status: QuoteStatus;
    itemsCount: number;
}

const QuoteManager: React.FC = () => {
    const [quotes] = useState<MockQuote[]>([
        { id: '1', quoteNumber: 'QT-23-001', customerName: 'AutoExpress Ltd', date: '2023-10-26', total: 45000, status: 'DRAFT' as any, itemsCount: 5 },
        { id: '2', quoteNumber: 'QT-23-002', customerName: 'John Kamau', date: '2023-10-25', total: 8500, status: 'SENT' as any, itemsCount: 2 },
        { id: '3', quoteNumber: 'QT-23-003', customerName: 'Simba Corp', date: '2023-10-24', total: 120000, status: 'ACCEPTED' as any, itemsCount: 12 },
        { id: '4', quoteNumber: 'QT-23-004', customerName: 'Jane Doe', date: '2023-10-20', total: 2500, status: 'EXPIRED' as any, itemsCount: 1 },
    ]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Draft</span>;
            case 'SENT': return <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Sent</span>;
            case 'ACCEPTED': return <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Accepted</span>;
            case 'EXPIRED': return <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Expired</span>;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Quotations</h2>
                    <p className="text-sm text-gray-500">Manage sales quotes and proforma invoices.</p>
                </div>
                <button className="bg-masuma-dark text-white px-4 py-2 rounded font-bold text-sm uppercase flex items-center gap-2 hover:bg-masuma-orange transition">
                    <FileText size={16} /> Create New Quote
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" placeholder="Search Quote # or Customer..." />
                    </div>
                    <select className="p-2 border border-gray-300 rounded bg-white text-sm text-gray-600 outline-none">
                        <option>All Statuses</option>
                        <option>Draft</option>
                        <option>Sent</option>
                        <option>Accepted</option>
                    </select>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Quote #</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Date Created</th>
                                <th className="px-6 py-4">Total Value</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {quotes.map(quote => (
                                <tr key={quote.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono font-bold text-masuma-dark">{quote.quoteNumber}</td>
                                    <td className="px-6 py-4 font-bold text-gray-700">{quote.customerName}</td>
                                    <td className="px-6 py-4 text-gray-500">{quote.date}</td>
                                    <td className="px-6 py-4 font-bold">KES {quote.total.toLocaleString()}</td>
                                    <td className="px-6 py-4">{getStatusBadge(quote.status as any)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {quote.status === 'DRAFT' as any && (
                                                <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Convert to Invoice">
                                                    <DollarSign size={16} />
                                                </button>
                                            )}
                                            <button className="p-1 text-gray-400 hover:text-masuma-orange"><ArrowRight size={16} /></button>
                                            <button className="p-1 text-gray-400 hover:text-masuma-dark"><MoreHorizontal size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default QuoteManager;
