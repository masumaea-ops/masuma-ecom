import React from 'react';
import { Smartphone, RefreshCw, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { MpesaLog } from '../../types';

const MpesaLogs: React.FC = () => {
    const logs: MpesaLog[] = [
        { id: '1', checkoutRequestID: 'ws_CO_251020231000_00001', phoneNumber: '254700123456', amount: 4500, status: 'COMPLETED', mpesaReceiptNumber: 'RJA001K2L', date: '2023-10-25 10:00:05', resultDesc: 'The service request is processed successfully.' },
        { id: '2', checkoutRequestID: 'ws_CO_251020231005_00002', phoneNumber: '254711987654', amount: 1200, status: 'FAILED', date: '2023-10-25 10:05:22', resultDesc: 'The balance is insufficient for the transaction.' },
        { id: '3', checkoutRequestID: 'ws_CO_251020231010_00003', phoneNumber: '254722333444', amount: 8500, status: 'PENDING', date: '2023-10-25 10:10:15' },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold uppercase"><CheckCircle size={12} /> Success</span>;
            case 'FAILED': return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-[10px] font-bold uppercase"><AlertCircle size={12} /> Failed</span>;
            case 'PENDING': return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-[10px] font-bold uppercase"><RefreshCw size={12} className="animate-spin" /> Processing</span>;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">M-Pesa Logs</h2>
                    <p className="text-sm text-gray-500">Real-time transaction status and error logs.</p>
                </div>
                <button className="text-masuma-orange hover:bg-orange-50 px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition">
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" placeholder="Search Phone or Receipt..." />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Checkout ID</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Phone Number</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Receipt #</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Result Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-gray-500 text-xs">{log.checkoutRequestID}</td>
                                    <td className="px-6 py-4 text-gray-600 text-xs">{log.date}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-masuma-dark">{log.phoneNumber}</td>
                                    <td className="px-6 py-4 font-bold">KES {log.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 font-mono text-masuma-dark">{log.mpesaReceiptNumber || '-'}</td>
                                    <td className="px-6 py-4">{getStatusBadge(log.status)}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" title={log.resultDesc}>
                                        {log.resultDesc || 'Waiting for callback...'}
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

export default MpesaLogs;
