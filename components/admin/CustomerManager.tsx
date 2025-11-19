import React, { useState } from 'react';
import { Search, Users, Edit2, Trash2, Plus, ShieldCheck } from 'lucide-react';
import { Customer } from '../../types';

const CustomerManager: React.FC = () => {
    const [customers] = useState<Customer[]>([
        { id: '1', name: 'John Kamau', phone: '0700123456', email: 'john@gmail.com', isWholesale: false, totalSpend: 12500, lastVisit: '2023-10-24', kraPin: 'A001234567Z' },
        { id: '2', name: 'AutoExpress Ltd', phone: '0722111222', email: 'procurement@autoexpress.co.ke', isWholesale: true, totalSpend: 450000, lastVisit: '2023-10-22', kraPin: 'P0511122233X' },
        { id: '3', name: 'Sarah Ochieng', phone: '0733444555', isWholesale: false, totalSpend: 4500, lastVisit: '2023-09-15' },
    ]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Customer CRM</h2>
                    <p className="text-sm text-gray-500">Manage B2B/B2C clients and KRA details.</p>
                </div>
                <button className="bg-masuma-orange text-white px-4 py-2 rounded font-bold text-sm uppercase flex items-center gap-2 hover:bg-orange-600 transition">
                    <Plus size={16} /> Add Customer
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" placeholder="Search Name, Phone, or KRA PIN..." />
                    </div>
                    <select className="p-2 border border-gray-300 rounded bg-white text-sm text-gray-600 outline-none">
                        <option>All Customers</option>
                        <option>Wholesale (B2B)</option>
                        <option>Retail (B2C)</option>
                    </select>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Account Type</th>
                                <th className="px-6 py-4">KRA PIN</th>
                                <th className="px-6 py-4">Total Spend</th>
                                <th className="px-6 py-4">Last Visit</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {customers.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${c.isWholesale ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {c.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-800">{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-masuma-dark">{c.phone}</div>
                                        <div className="text-xs text-gray-500">{c.email || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.isWholesale ? (
                                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Wholesale</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Retail</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{c.kraPin || '-'}</td>
                                    <td className="px-6 py-4 font-bold text-masuma-dark">KES {c.totalSpend.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">{c.lastVisit}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-1 text-gray-400 hover:text-masuma-orange"><Edit2 size={16} /></button>
                                            <button className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
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

export default CustomerManager;
