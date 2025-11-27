
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Shield, Key, Trash2, Edit, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

interface UserData {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

const UserManager: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form State
    const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', role: 'CASHIER' });

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async () => {
        try {
            await apiClient.post('/users', newUser);
            setIsCreating(false);
            fetchUsers();
            alert('User created successfully');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create user');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await apiClient.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    return (
        <div className="h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">User Management</h2>
                    <p className="text-sm text-gray-500">Manage staff access and permissions.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-masuma-dark text-white px-4 py-2 rounded font-bold text-sm uppercase flex items-center gap-2 hover:bg-masuma-orange transition"
                >
                    <UserPlus size={16} /> {isCreating ? 'Cancel' : 'Add New User'}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6 animate-slide-up">
                    <h3 className="font-bold text-masuma-dark uppercase mb-4">Create New Staff Account</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            className="p-2 border rounded"
                            value={newUser.fullName}
                            onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                        />
                        <input 
                            type="email" 
                            placeholder="Email" 
                            className="p-2 border rounded"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            className="p-2 border rounded"
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                        />
                        <select 
                            className="p-2 border rounded bg-white"
                            value={newUser.role}
                            onChange={e => setNewUser({...newUser, role: e.target.value})}
                        >
                            <option value="CASHIER">Cashier</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Admin</option>
                            <option value="B2B_USER">B2B User</option>
                        </select>
                    </div>
                    <button onClick={handleCreateUser} className="bg-green-600 text-white px-6 py-2 rounded font-bold uppercase text-xs">
                        Save User
                    </button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-masuma-orange" size={32} />
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created At</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                                {user.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-masuma-dark">{user.fullName}</div>
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
                                        {user.isActive ? (
                                            <span className="text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-1 rounded">Active</span>
                                        ) : (
                                            <span className="text-red-500 font-bold text-[10px] uppercase bg-red-50 px-2 py-1 rounded">Inactive</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleDelete(user.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UserManager;
