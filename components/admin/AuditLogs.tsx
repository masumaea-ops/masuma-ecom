
import React from 'react';
import { Clock, User, AlertCircle, Activity } from 'lucide-react';

const AuditLogs: React.FC = () => {
    const logs = [
        { id: 1, action: 'STOCK_ADJUSTMENT', user: 'Admin User', detail: 'Adjusted stock for SKU MFC-112: +50 units', time: '10 mins ago', type: 'info' },
        { id: 2, action: 'PRICE_UPDATE', user: 'Mike Kibet', detail: 'Updated price for SKU MS-2444 to KES 4,800', time: '1 hour ago', type: 'warning' },
        { id: 3, action: 'USER_LOGIN_FAILED', user: 'unknown', detail: 'Failed login attempt from IP 192.168.1.45', time: '2 hours ago', type: 'error' },
        { id: 4, action: 'ORDER_DELETED', user: 'Admin User', detail: 'Deleted voided order ORD-005', time: 'Yesterday', type: 'error' },
        { id: 5, action: 'SETTINGS_CHANGED', user: 'Admin User', detail: 'Updated Branch Address information', time: 'Yesterday', type: 'info' },
    ];

    const getIcon = (type: string) => {
        switch(type) {
            case 'error': return <AlertCircle size={16} className="text-red-500" />;
            case 'warning': return <AlertCircle size={16} className="text-orange-500" />;
            default: return <Activity size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Audit Logs</h2>
                    <p className="text-sm text-gray-500">Security and operational activity trail.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-left text-sm">
                         <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Activity</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getIcon(log.type)}
                                            <span className="font-bold text-masuma-dark text-xs uppercase">{log.action.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <User size={14} /> {log.user}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{log.detail}</td>
                                    <td className="px-6 py-4 text-right text-gray-400 flex items-center justify-end gap-1">
                                        <Clock size={14} /> {log.time}
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

export default AuditLogs;
