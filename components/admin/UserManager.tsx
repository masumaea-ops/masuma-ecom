
import React, { useState } from 'react';
import { Search, UserPlus, Shield, Key, Trash2, Edit } from 'lucide-react';

const UserManager: React.FC = () => {
    const [users] = useState([
        { id: 1, name: 'Admin User', email: 'admin@masuma.co.ke', role: 'ADMIN', status: 'ACTIVE', lastLogin: 'Today, 10:30 AM' },
        { id: 2, name: 'Jane Doe', email: 'jane.doe@masuma.co.ke', role: 'CASHIER', status: 'ACTIVE', lastLogin: 'Today, 08:00 AM' },
        { id: 3, name: 'Mike Kibet', email: 'mike.k@masuma.co.ke', role: 'MANAGER', status: 'ACTIVE', lastLogin: 'Yesterday, 5:00 PM' },
        { id: 4, name: 'John Smith', email: 'john.s@masuma.co.ke', role: 'CASHIER', status: 'INACTIVE', lastLogin: 'Oct 12, 2023' },
    ]);

    return (
        <div className="h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">User Management</h2>
                    <p className="text-sm text-gray-500">Manage staff access and permissions.</p>
                </div>
                <button className="bg-masuma-dark text-white px-4 py-2 rounded font-bold text-sm uppercase flex items-center gap-2 hover:bg-masuma-orange transition">
                    <UserPlus size={16} /> Add New User
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" placeholder="Search by Name or Email..." />
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Last Login</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-masuma-dark">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center gap-1 w-fit ${
                                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                        user.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        <Shield size={10} /> {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                     {user.status === 'ACTIVE' ? (
                                         <span className="text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-1 rounded">Active</span>
                                     ) : (
                                         <span className="text-red-500 font-bold text-[10px] uppercase bg-red-50 px-2 py-1 rounded">Inactive</span>
                                     )}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{user.lastLogin}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="p-1 text-gray-400 hover:text-masuma-orange"><Edit size={16} /></button>
                                        <button className="p-1 text-gray-400 hover:text-masuma-orange"><Key size={16} /></button>
                                        <button className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManager;
