
import React, { useState } from 'react';
import { Truck, MapPin, CheckCircle, Printer, Search, Package } from 'lucide-react';

const ShippingManager: React.FC = () => {
    const [shipments] = useState([
        { id: 'SHP-1001', orderId: 'ORD-002', customer: 'Sarah Ochieng', location: 'Westlands, Nairobi', status: 'READY', items: 5, driver: null },
        { id: 'SHP-1002', orderId: 'ORD-004', customer: 'AutoExpress Ltd', location: 'Mombasa Road', status: 'DISPATCHED', items: 24, driver: 'James Mwangi' },
        { id: 'SHP-1003', orderId: 'ORD-005', customer: 'Gilbert Koech', location: 'Eldoret Town', status: 'IN_TRANSIT', items: 2, courier: 'G4S' },
    ]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'READY': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Ready to Ship</span>;
            case 'DISPATCHED': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Dispatched</span>;
            case 'IN_TRANSIT': return <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-bold uppercase">In Transit</span>;
            case 'DELIVERED': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Delivered</span>;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Shipping & Logistics</h2>
                    <p className="text-sm text-gray-500">Assign drivers, generate waybills, and track deliveries.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-4 rounded shadow-sm border-l-4 border-yellow-400">
                    <div className="text-xs font-bold text-gray-500 uppercase">Pending Dispatch</div>
                    <div className="text-2xl font-bold text-masuma-dark">12</div>
                </div>
                <div className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-400">
                    <div className="text-xs font-bold text-gray-500 uppercase">On The Road</div>
                    <div className="text-2xl font-bold text-masuma-dark">5</div>
                </div>
                <div className="bg-white p-4 rounded shadow-sm border-l-4 border-masuma-orange">
                    <div className="text-xs font-bold text-gray-500 uppercase">Available Drivers</div>
                    <div className="text-2xl font-bold text-masuma-dark">3</div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" placeholder="Search Shipment ID or Location..." />
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded font-bold text-sm text-gray-600 hover:bg-gray-50">Filter Status</button>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Shipment ID</th>
                                <th className="px-6 py-4">Order Ref</th>
                                <th className="px-6 py-4">Customer & Location</th>
                                <th className="px-6 py-4">Contents</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Assigned To</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {shipments.map(ship => (
                                <tr key={ship.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono font-bold text-masuma-dark">{ship.id}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{ship.orderId}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{ship.customer}</div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={10} /> {ship.location}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{ship.items} Items</td>
                                    <td className="px-6 py-4">{getStatusBadge(ship.status)}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-gray-700">
                                        {ship.driver || ship.courier || <span className="text-red-400 italic">Unassigned</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-1 text-gray-400 hover:text-masuma-dark" title="Print Waybill"><Printer size={16} /></button>
                                            <button className="p-1 text-gray-400 hover:text-masuma-orange" title="Assign Driver"><Truck size={16} /></button>
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

export default ShippingManager;
