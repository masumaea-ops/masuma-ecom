
import React, { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, Clock, Truck, Loader2, RefreshCw, XCircle, DollarSign } from 'lucide-react';
import { Order } from '../../types';
import { apiClient } from '../../utils/apiClient';
import OrderDetailsModal from './OrderDetailsModal';

const OrderManager: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/orders');
            setOrders(res.data);
        } catch (error) {
            console.error("Fetch orders failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        if (!confirm(`Are you sure you want to mark this order as ${status}?`)) return;
        setProcessingId(id);
        try {
            await apiClient.patch(`/orders/${id}/status`, { status });
            fetchOrders();
        } catch (error) {
            alert('Failed to update status');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
            case 'PAID': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><CheckCircle size={12} /> Paid</span>;
            case 'SHIPPED': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><Truck size={12} /> Shipped</span>;
            case 'DELIVERED': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><CheckCircle size={12} /> Delivered</span>;
            case 'FAILED': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit"><XCircle size={12} /> Cancelled</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase">{status}</span>;
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div>
            <OrderDetailsModal 
                order={selectedOrder} 
                isOpen={!!selectedOrder} 
                onClose={() => setSelectedOrder(null)} 
                onUpdateStatus={updateStatus} 
            />

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Order Management</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                         <span>Total Orders: {orders.length}</span>
                         <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                         <span>Pending: {orders.filter(o => o.status === 'PENDING').length}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchOrders} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Refresh">
                         <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex gap-4 items-center bg-gray-50">
                     <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" 
                            placeholder="Search Order ID, Customer Name..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                     </div>
                     <select 
                        className="p-2 border border-gray-300 rounded bg-white text-sm font-bold text-gray-600 outline-none"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                     >
                        <option value="All">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="FAILED">Cancelled</option>
                     </select>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                         <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-masuma-orange" size={32} />
                         </div>
                    ) : (
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
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                        <td className="px-6 py-4 font-mono font-bold text-masuma-dark">{order.orderNumber}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-sm text-gray-800">{order.customerName}</div>
                                            <div className="text-xs text-gray-500">{order.items.length} items</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{order.date}</td>
                                        <td className="px-6 py-4 font-bold text-masuma-dark">{order.total.toLocaleString()}</td>
                                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                {order.status === 'PENDING' && (
                                                    <>
                                                        <button 
                                                            onClick={() => updateStatus(order.id, 'PAID')}
                                                            disabled={processingId === order.id}
                                                            className="p-1 text-green-600 hover:bg-green-50 rounded" 
                                                            title="Mark Paid"
                                                        >
                                                            <DollarSign size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-1 text-gray-400 hover:text-masuma-orange transition" 
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-gray-500">No orders found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderManager;
