
import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'warning' | 'success' | 'info';
    time: string;
}

interface NotificationsPopoverProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ isOpen, onClose }) => {
    const notifications: Notification[] = [
        { id: 1, title: 'Low Stock Alert', message: 'Oil Filter (MFC-112) is below threshold (5 units left).', type: 'warning', time: '10 min ago' },
        { id: 2, title: 'New Online Order', message: 'Order #ORD-992 received from Website.', type: 'success', time: '1 hour ago' },
        { id: 3, title: 'System Update', message: 'KRA Tax Rates updated successfully.', type: 'info', time: 'Yesterday' },
    ];

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-scale-up overflow-hidden">
            <div className="p-3 bg-masuma-dark text-white flex justify-between items-center border-b border-gray-700">
                <h4 className="font-bold text-xs uppercase tracking-wider">Notifications</h4>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={14} /></button>
            </div>
            <div className="max-h-64 overflow-y-auto">
                {notifications.map(notif => (
                    <div key={notif.id} className="p-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer relative group">
                        <div className="flex gap-3">
                            <div className={`mt-1 ${
                                notif.type === 'warning' ? 'text-orange-500' : 
                                notif.type === 'success' ? 'text-green-500' : 'text-blue-500'
                            }`}>
                                {notif.type === 'warning' ? <AlertTriangle size={16} /> : 
                                 notif.type === 'success' ? <CheckCircle size={16} /> : <Info size={16} />}
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-gray-800">{notif.title}</h5>
                                <p className="text-xs text-gray-500 leading-tight my-1">{notif.message}</p>
                                <p className="text-[10px] text-gray-400">{notif.time}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-2 text-center bg-gray-50 border-t border-gray-200">
                <button className="text-xs font-bold text-masuma-orange hover:text-masuma-dark uppercase">View All</button>
            </div>
        </div>
    );
};

export default NotificationsPopover;
