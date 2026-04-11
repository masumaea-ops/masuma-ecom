
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Shield, Key, Trash2, Edit, Loader2, Building } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { Branch } from '../../types';

interface UserData {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    discountPercentage: number;
    businessName?: string;
    taxId?: string;
    phone?: string;
    address?: string;
    branch?: {
        id: string;
        name: string;
    };
}

const UserManager: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    
    // Form State
    const [newUser, setNewUser] = useState({ 
        fullName: '', 
        email: '', 
        password: '', 
        role: 'CASHIER',
        branchId: ''
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [usersRes, branchesRes] = await Promise.all([
                apiClient.get('/users'),
                apiClient.get('/branches')
            ]);
            setUsers(usersRes.data);
            setBranches(branchesRes.data);
        } catch (error) {
            console.error(error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            await apiClient.patch(`/users/${id}/status`, { status });
            fetchData();
        } catch (error) {
            alert('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdateDiscount = async (id: string, discount: number) => {
        try {
            await apiClient.patch(`/users/${id}/discount`, { discount });
            setUsers(users.map(u => u.id === id ? { ...u, discountPercentage: discount } : u));
        } catch (error) {
            alert('Failed to update discount');
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.fullName || !newUser.email || !newUser.password) {
            alert('Please fill in all required fields.');
            return;
        }
        try {
            // Only send branchId if selected
            const payload = {
                ...newUser,
                branchId: newUser.branchId || undefined
            };
            
            await apiClient.post('/users', payload);
            setIsCreating(false);
            setNewUser({ fullName: '', email: '', password: '', role: 'CASHIER', branchId: '' });
            fetchData();
            alert('User created successfully');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create user');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await apiClient.delete(`/users/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    return (
        <div className="h-full flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">User Management</h2>
                    <p className="text-sm text-gray-500">Manage staff access, roles, and branch assignments.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input 
                            type="text" 
                            placeholder="Full Name *" 
                            className="p-2 border rounded focus:border-masuma-orange outline-none"
                            value={newUser.fullName}
                            onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                        />
                        <input 
                            type="email" 
                            placeholder="Email Address *" 
                            className="p-2 border rounded focus:border-masuma-orange outline-none"
                            value={newUser.email}
                            onChange={e => setNewUser({...newUser, email: e.target.value})}
                        />
                        <input 
                            type="password" 
                            placeholder="Password *" 
                            className="p-2 border rounded focus:border-masuma-orange outline-none"
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <select 
                                className="p-2 border rounded bg-white focus:border-masuma-orange outline-none"
                                value={newUser.role}
                                onChange={e => setNewUser({...newUser, role: e.target.value})}
                            >
                                <option value="CASHIER">Cashier</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                                <option value="B2B_USER">B2B User</option>
                            </select>
                            <select 
                                className="p-2 border rounded bg-white focus:border-masuma-orange outline-none"
                                value={newUser.branchId}
                                onChange={e => setNewUser({...newUser, branchId: e.target.value})}
                            >
                                <option value="">Assign Branch (Optional)</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleCreateUser} className="bg-green-600 text-white px-6 py-2 rounded font-bold uppercase text-xs hover:bg-green-700 transition">
                            Save User
                        </button>
                    </div>
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
                                <th className="px-6 py-4">User / Business</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Branch / Discount</th>
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
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 shrink-0">
                                                {user.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-masuma-dark">{user.fullName}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                                {user.businessName && (
                                                    <div className="text-[10px] text-masuma-orange font-black uppercase mt-0.5 flex items-center gap-1">
                                                        <Building size={10} /> {user.businessName}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center gap-1 w-fit ${
                                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                                            user.role === 'B2B_USER' ? 'bg-orange-100 text-orange-700' :
                                            user.role === 'DEALER' ? 'bg-indigo-100 text-indigo-700' :
                                            user.role === 'INDIVIDUAL_SELLER' ? 'bg-pink-100 text-pink-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            <Shield size={10} /> {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === 'B2B_USER' ? (
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Discount %</label>
                                                <input 
                                                    type="number" 
                                                    className="w-16 p-1 border rounded text-xs font-bold outline-none focus:border-masuma-orange"
                                                    value={user.discountPercentage}
                                                    onChange={(e) => handleUpdateDiscount(user.id, Number(e.target.value))}
                                                />
                                            </div>
                                        ) : user.branch ? (
                                            <span className="flex items-center gap-1 text-gray-700 text-xs">
                                                <Building size={12} className="text-masuma-orange"/> {user.branch.name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Global / HQ</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {(user.role === 'B2B_USER' || user.role === 'DEALER' || user.role === 'INDIVIDUAL_SELLER') ? (
                                            <div className="flex flex-col gap-2">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded w-fit ${
                                                    user.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {user.status}
                                                </span>
                                                {user.status === 'PENDING' && (
                                                    <div className="flex gap-1">
                                                        <button 
                                                            disabled={updatingId === user.id}
                                                            onClick={() => handleUpdateStatus(user.id, 'APPROVED')}
                                                            className="text-[9px] font-bold bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button 
                                                            disabled={updatingId === user.id}
                                                            onClick={() => handleUpdateStatus(user.id, 'REJECTED')}
                                                            className="text-[9px] font-bold bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : user.isActive ? (
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
