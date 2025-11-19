
import React from 'react';
import { Search, Eye, MoreHorizontal, CheckCircle, Clock, Truck } from 'lucide-react';

const OrderManager: React.FC = () => {
    const orders = [
        { id: 'ORD-001', customer: 'John Kamau', date: 'Oct 24, 2023', amount: 4500, status: 'PENDING', items: 3 },
        { id: 'ORD-002', customer: 'Sarah Ochieng', date: 'Oct 23, 2023', amount: 12500, status: 'PAID', items: 5 },
        { id: 'ORD-003', customer: 'David Patel', date: 'Oct 23, 2023', amount: 2200, status: 'SHIPPED', items: 1 },
        { id: 'ORD-004', customer: 'AutoExpress Ltd', date: 'Oct 22, 2023', amount: 85000, status: 'DELIVERED', items: 24 },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
            case 'PAID': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><CheckCircle size={12} /> Paid</span>;
            case 'SHIPPED': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><Truck size={12} /> Shipped</span>;
            case 'DELIVERED': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><CheckCircle size={12} /> Delivered</span>;
            default: return null;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Order Management</h2>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-bold text-gray-600 hover:bg-gray-50">Export CSV</button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex gap-4 items-center bg-gray-50">
                     <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" placeholder="Search Order ID, Customer Name..." />
                     </div>
                     <select className="p-2 border border-gray-300 rounded bg-white text-sm font-bold text-gray-600 outline-none">
                        <option>All Statuses</option>
                        <option>Pending</option>
                        <option>Paid</option>
                        <option>Shipped</option>
                     </select>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Total (KES)</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-mono font-bold text-masuma-dark">{order.id}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-sm">{order.customer}</div>
                                    <div className="text-xs text-gray-500">{order.items} items</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                                <td className="px-6 py-4 font-bold text-masuma-dark">{order.amount.toLocaleString()}</td>
                                <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 text-gray-400 hover:text-masuma-orange transition">
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderManager;
