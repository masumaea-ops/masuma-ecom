import React, { useState, useEffect } from 'react';
import { Mail, Trash2, Loader2, RefreshCw, CheckCircle, Search, UserCheck } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

interface Subscriber {
    id: string;
    email: string;
    isActive: boolean;
    createdAt: string;
}

const SubscriberManager: React.FC = () => {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSubscribers = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/newsletter');
            setSubscribers(res.data);
        } catch (error) {
            console.error('Failed to fetch subscribers', error);
            setSubscribers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Unsubscribe this user?')) return;
        try {
            await apiClient.delete(`/newsletter/${id}`);
            fetchSubscribers();
        } catch (error) {
            alert('Operation failed');
        }
    };

    const filtered = subscribers.filter(s => s.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase flex items-center gap-2">
                        <Mail className="text-masuma-orange" /> Newsletter Audience
                    </h2>
                    <p className="text-sm text-gray-500">View and export your customer mailing list.</p>
                </div>
                <button onClick={fetchSubscribers} className="p-2 bg-white border rounded hover:bg-gray-50">
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-2 border rounded focus:border-masuma-orange outline-none bg-white text-sm" 
                            placeholder="Search email..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-masuma-orange" /></div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b">
                                <tr>
                                    <th className="px-6 py-4">Subscriber Email</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Joined Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(sub => (
                                    <tr key={sub.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4 font-bold text-masuma-dark text-sm">{sub.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1 w-fit">
                                                <UserCheck size={12}/> Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(sub.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(sub.id)} className="text-gray-300 hover:text-red-500 transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-12 text-gray-400 text-sm">No subscribers found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriberManager;