import React, { useState } from 'react';
import { Search, Eye, Printer, FileText, Filter, Download } from 'lucide-react';
import { Sale } from '../../types';

const SalesHistory: React.FC = () => {
    // Mock Data
    const sales: Sale[] = [
        { id: '1', receiptNumber: 'RCP-8392-001', date: '2023-10-25 10:30', totalAmount: 4500, paymentMethod: 'CASH', cashierName: 'Jane Doe', itemsCount: 2, kraControlCode: 'KRA001-23498' },
        { id: '2', receiptNumber: 'RCP-8392-002', date: '2023-10-25 11:15', totalAmount: 12800, paymentMethod: 'MPESA', cashierName: 'Jane Doe', itemsCount: 4, customerName: 'John Kamau', kraControlCode: 'KRA001-23499' },
        { id: '3', receiptNumber: 'RCP-8392-003', date: '2023-10-25 12:45', totalAmount: 850, paymentMethod: 'CASH', cashierName: 'Mike Kibet', itemsCount: 1, kraControlCode: 'KRA001-23500' },
        { id: '4', receiptNumber: 'RCP-8392-004', date: '2023-10-25 14:20', totalAmount: 25000, paymentMethod: 'CREDIT', cashierName: 'Jane Doe', itemsCount: 12, customerName: 'AutoExpress Ltd', kraControlCode: 'KRA001-23501' },
    ];

    const [searchTerm, setSearchTerm] = useState('');

    const filteredSales = sales.filter(s => 
        s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Sales History</h2>
                    <p className="text-sm text-gray-500">Audit trail of all POS transactions.</p>
                </div>
                <button className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded font-bold uppercase text-xs hover:bg-gray-50 flex items-center gap-2">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex gap-4 items-center bg-gray-50">
                     <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" 
                            placeholder="Search Receipt # or Customer..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                     </div>
                     <div className="flex items-center gap-2">
                         <button className="px-3 py-2 bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-50"><Filter size={18} /></button>
                         <input type="date" className="px-3 py-2 bg-white border border-gray-300 rounded text-gray-600 outline-none" />
                     </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
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
                            {filteredSales.map(sale => (
                                <tr key={sale.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-mono font-bold text-masuma-dark">{sale.receiptNumber}</td>
                                    <td className="px-6 py-4 text-gray-500">{sale.date}</td>
                                    <td className="px-6 py-4">
                                        {sale.customerName ? (
                                            <span className="font-bold text-gray-800">{sale.customerName}</span>
                                        ) : (
                                            <span className="text-gray-400 italic">Walk-in</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{sale.itemsCount}</td>
                                    <td className="px-6 py-4 font-bold text-masuma-dark">{sale.totalAmount.toLocaleString()}</td>
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
                                            <button className="p-2 text-gray-400 hover:text-masuma-dark" title="Reprint Receipt"><Printer size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
                    <span>Showing {filteredSales.length} records</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 bg-white border border-gray-300 rounded disabled:opacity-50">Previous</button>
                        <button className="px-3 py-1 bg-white border border-gray-300 rounded">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesHistory;
