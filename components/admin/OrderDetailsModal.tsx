
import React, { useRef } from 'react';
import { X, Printer, Mail, MapPin, Phone, User, CreditCard, Package } from 'lucide-react';
import { Order } from '../../types';
import InvoiceTemplate from './InvoiceTemplate';

interface OrderDetailsModalProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateStatus: (id: string, status: string) => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, isOpen, onClose, onUpdateStatus }) => {
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !order) return null;

    const handlePrint = () => {
        // In a real scenario, you might use a dedicated print window or library
        // For this demo, we rely on CSS @media print hiding the modal UI
        window.print();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'text-yellow-600 bg-yellow-100';
            case 'PAID': return 'text-blue-600 bg-blue-100';
            case 'SHIPPED': return 'text-purple-600 bg-purple-100';
            case 'DELIVERED': return 'text-green-600 bg-green-100';
            case 'FAILED': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {/* Hidden Print Component */}
            <div className="hidden print:block fixed inset-0 bg-white z-[1000]">
                <InvoiceTemplate data={order} type="RECEIPT" ref={printRef} />
            </div>

            <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up print:hidden">
                {/* Header */}
                <div className="bg-masuma-dark text-white p-6 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold font-display uppercase tracking-wider">Order #{order.orderNumber}</h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                            <Package size={14} /> Placed on {order.date}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Customer Info */}
                        <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                            <h4 className="font-bold text-masuma-dark uppercase text-xs mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                                <User size={14} /> Customer Details
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p className="font-bold text-gray-800">{order.customerName}</p>
                                <p className="text-gray-500 flex items-center gap-2"><Mail size={12} /> {order.customerEmail || 'N/A'}</p>
                                <p className="text-gray-500 flex items-center gap-2"><Phone size={12} /> {order.customerPhone || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Shipping Info */}
                        <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                            <h4 className="font-bold text-masuma-dark uppercase text-xs mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                                <MapPin size={14} /> Delivery Info
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-600">Standard Delivery</p>
                                <p className="text-gray-500">Nairobi Region</p>
                                <p className="text-xs text-gray-400 mt-2">Driver not yet assigned.</p>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                            <h4 className="font-bold text-masuma-dark uppercase text-xs mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                                <CreditCard size={14} /> Payment
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-600">Method: <span className="font-bold">{order.paymentMethod}</span></p>
                                <p className="text-gray-500">Status: {order.status === 'PAID' ? 'Confirmed' : 'Pending'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-6">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-6 py-3">Product</th>
                                    <th className="px-6 py-3">SKU</th>
                                    <th className="px-6 py-3 text-center">Qty</th>
                                    <th className="px-6 py-3 text-right">Unit Price</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.items.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-bold text-gray-800">{item.name}</td>
                                        <td className="px-6 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                                        <td className="px-6 py-3 text-center">{item.qty || item.quantity}</td>
                                        <td className="px-6 py-3 text-right">{Number(item.price).toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right font-bold">{(Number(item.price) * (item.qty || item.quantity)).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{((order.total / 1.16).toLocaleString(undefined, {maximumFractionDigits: 2}))}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>VAT (16%)</span>
                                    <span>{((order.total - (order.total / 1.16)).toLocaleString(undefined, {maximumFractionDigits: 2}))}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-masuma-dark border-t border-gray-300 pt-2">
                                    <span>Total</span>
                                    <span>KES {order.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-200 bg-white flex justify-between items-center">
                    <button 
                        onClick={handlePrint}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-600 font-bold uppercase text-xs hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Printer size={16} /> Print Packing Slip
                    </button>
                    <div className="flex gap-3">
                        {order.status === 'PENDING' && (
                            <button 
                                onClick={() => { onUpdateStatus(order.id, 'PAID'); onClose(); }}
                                className="bg-blue-600 text-white px-6 py-2 rounded font-bold uppercase text-xs hover:bg-blue-700 shadow-md"
                            >
                                Mark as Paid
                            </button>
                        )}
                        {order.status === 'PAID' && (
                            <button 
                                onClick={() => { onUpdateStatus(order.id, 'SHIPPED'); onClose(); }}
                                className="bg-purple-600 text-white px-6 py-2 rounded font-bold uppercase text-xs hover:bg-purple-700 shadow-md"
                            >
                                Dispatch Order
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;
