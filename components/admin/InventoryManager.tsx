import React from 'react';
import { Edit, AlertTriangle, Package } from 'lucide-react';

const InventoryManager: React.FC = () => {
    // Mock Data
    const stockItems = [
        { id: 1, name: 'Oil Filter (Spin-on)', sku: 'MFC-112', location: 'Nairobi HQ', qty: 145, min: 20 },
        { id: 2, name: 'Air Filter (Safari Spec)', sku: 'MFA-331', location: 'Nairobi HQ', qty: 12, min: 15 },
        { id: 3, name: 'Disc Brake Pads (Front)', sku: 'MS-2444', location: 'Mombasa Br', qty: 45, min: 10 },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-masuma-dark flex items-center gap-2">
                    <Package className="text-masuma-orange" />
                    Inventory Management
                </h2>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200">Transfer Stock</button>
                    <button className="px-4 py-2 bg-masuma-dark text-white text-sm font-bold rounded hover:bg-masuma-orange">Add Stock</button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                        <tr>
                            <th className="px-6 py-4">Product</th>
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">Branch</th>
                            <th className="px-6 py-4">Quantity</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {stockItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                                <td className="px-6 py-4 font-mono text-gray-500">{item.sku}</td>
                                <td className="px-6 py-4">{item.location}</td>
                                <td className="px-6 py-4 font-bold">{item.qty}</td>
                                <td className="px-6 py-4">
                                    {item.qty < item.min ? (
                                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold uppercase">
                                            <AlertTriangle size={12} /> Low Stock
                                        </span>
                                    ) : (
                                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold uppercase">Good</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-masuma-orange">
                                        <Edit size={18} />
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

export default InventoryManager;