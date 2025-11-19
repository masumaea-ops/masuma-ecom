
import React, { useState, useRef, useEffect } from 'react';
import { Search, Eye, Printer, FileText, Filter, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sale } from '../../types';
import InvoiceTemplate from './InvoiceTemplate';
import { apiClient } from '../../utils/apiClient';

const SalesHistory: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
    
    const [printSale, setPrintSale] = useState<Sale | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const fetchSales = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', pagination.limit.toString());
            if (searchTerm) params.append('search', searchTerm);
            if (filterDate) params.append('date', filterDate);

            const response = await apiClient.get(`/sales?${params.toString()}`);
            
            if (response.data.data) {
                setSales(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch sales", error);
            // Fallback mock if backend offline
            setSales([
               { id: '1', receiptNumber: 'RCP-OFFLINE-001', date: new Date().toISOString(), totalAmount: 4500, paymentMethod: 'CASH', cashierName: 'System', itemsCount: 2, kraControlCode: 'PENDING', itemsSnapshot: [] }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const delay = setTimeout(() => fetchSales(1), 500);
        return () => clearTimeout(delay);
    }, [searchTerm, filterDate]);

    const handlePrint = (sale: Sale) => {
        setPrintSale(sale);
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchSales(newPage);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Hidden Print Template */}
            <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[9999]">
                {printSale && <InvoiceTemplate data={printSale} type="TAX_INVOICE" ref={printRef} />}
            </div>

            <div className="flex justify-between items-center mb-6 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Sales History</h2>
                    <p className="text-sm text-gray-500">Audit trail of all POS transactions.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden print:hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                     <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" 
                            placeholder="Search Receipt # or Customer..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                     </div>
                     <div className="flex items-center gap-2 w-full md:w-auto">
                         <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-2">
                             <Filter size={16} className="text-gray-400" />
                             <input 
                                type="date" 
                                className="text-sm text-gray-600 outline-none" 
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                             />
                         </div>
                         {filterDate && (
                            <button onClick={() => setFilterDate('')} className="text-xs text-red-500 hover:underline">Clear</button>
                         )}
                     </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="animate-spin text-masuma-orange" size={32} />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-4">Receipt #</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Items</th>
                                    <th className="px-6 py-4">Total (KES)</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">KRA Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {sales.map(sale => (
                                    <tr key={sale.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-mono font-bold text-masuma-dark">{sale.receiptNumber}</td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(sale.createdAt || sale.date).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            {sale.customerName ? (
                                                <span className="font-bold text-gray-800">{sale.customerName}</span>
                                            ) : (
                                                <span className="text-gray-400 italic">Walk-in</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{sale.itemsCount || (sale.itemsSnapshot?.length || 0)}</td>
                                        <td className="px-6 py-4 font-bold text-masuma-dark">{Number(sale.totalAmount).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                                                sale.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' : 
                                                sale.paymentMethod === 'MPESA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {sale.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {sale.kraControlCode ? (
                                                <span className="flex items-center gap-1 text-green-600 font-bold text-[10px] uppercase">
                                                    <FileText size={12} /> Signed
                                                </span>
                                            ) : (
                                                <span className="text-red-500 font-bold text-[10px] uppercase">Pending</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-2 text-gray-400 hover:text-masuma-orange" title="View Details"><Eye size={16} /></button>
                                                <button 
                                                    onClick={() => handlePrint(sale)}
                                                    className="p-2 text-gray-400 hover:text-masuma-dark" 
                                                    title="Reprint Receipt"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {sales.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-gray-500">No sales found matching your criteria.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                        Showing page {pagination.page} of {pagination.pages} ({pagination.total} records)
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesHistory;
