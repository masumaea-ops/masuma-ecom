
import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Plus, Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Customer } from '../../types';
import { apiClient, formatCurrency } from '../../utils/apiClient';

const CustomerManager: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    
    // New Customer Form
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        kraPin: '',
        isWholesale: false,
        address: ''
    });

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/customers?search=${searchTerm}`);
            setCustomers(res.data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => fetchCustomers(), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleCreate = async () => {
        try {
            await apiClient.post('/customers', newCustomer);
            setIsCreating(false);
            setNewCustomer({ name: '', phone: '', email: '', kraPin: '', isWholesale: false, address: '' });
            fetchCustomers();
        } catch (error) {
            alert('Failed to create customer');
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Customer CRM</h2>
                    <p className="text-sm text-gray-500">Manage B2B/B2C clients, KRA PINs, and credit limits.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="bg-masuma-orange text-white px-4 py-2 rounded font-bold text-sm uppercase flex items-center gap-2 hover:bg-orange-600 transition shadow-md"
                >
                    <Plus size={16} /> {isCreating ? 'Cancel' : 'Add Customer'}
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-6 animate-slide-up">
                    <h3 className="font-bold text-masuma-dark uppercase mb-4 border-b pb-2">New Client Registration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Full Name / Company Name" className="p-3 border rounded focus:border-masuma-orange outline-none" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                        <input type="tel" placeholder="Phone Number" className="p-3 border rounded focus:border-masuma-orange outline-none" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                        <input type="email" placeholder="Email Address" className="p-3 border rounded focus:border-masuma-orange outline-none" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                        <input type="text" placeholder="KRA PIN" className="p-3 border rounded focus:border-masuma-orange outline-none uppercase" value={newCustomer.kraPin} onChange={e => setNewCustomer({...newCustomer, kraPin: e.target.value})} />
                        <input type="text" placeholder="Physical Address" className="p-3 border rounded focus:border-masuma-orange outline-none md:col-span-2" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                        
                        <div className="flex items-center gap-3 md:col-span-2 bg-gray-50 p-3 rounded">
                            <input 
                                type="checkbox" 
                                id="wholesale" 
                                className="w-5 h-5 text-masuma-orange"
                                checked={newCustomer.isWholesale}
                                onChange={e => setNewCustomer({...newCustomer, isWholesale: e.target.checked})}
                            />
                            <label htmlFor="wholesale" className="text-sm font-bold text-gray-700 cursor-pointer">
                                Enable Wholesale Pricing (B2B Account)
                            </label>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleCreate} className="bg-masuma-dark text-white px-8 py-2 rounded font-bold uppercase hover:bg-gray-800">Save Profile</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" 
                            placeholder="Search Name, Phone, or KRA PIN..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => fetchCustomers()} className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-500">
                        <RefreshCw size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-masuma-orange" size={32} />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Contact Info</th>
                                    <th className="px-6 py-4">Account Type</th>
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
                                        <td className="px-6 py-4 font-bold text-masuma-dark">
                                            {formatCurrency(c.totalSpend || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {c.lastVisit || 'Never'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button className="p-1 text-gray-400 hover:text-masuma-orange"><Edit2 size={16} /></button>
                                                <button className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {customers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No customers found.</td>
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

export default CustomerManager;
