import React, { useState } from 'react';
import { Save, Settings, Users, Building, FileText } from 'lucide-react';

const SettingsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">System Settings</h2>
                    <p className="text-sm text-gray-500">Configure Branch, Users, and Fiscal Devices.</p>
                </div>
                <button className="bg-masuma-dark text-white px-6 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-masuma-orange transition shadow-lg flex items-center gap-2">
                    <Save size={18} /> Save Changes
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex min-h-[500px]">
                {/* Sidebar */}
                <div className="w-64 bg-gray-50 border-r border-gray-200">
                    {[
                        { id: 'general', label: 'General Config', icon: Settings },
                        { id: 'users', label: 'User Management', icon: Users },
                        { id: 'branch', label: 'Branch Details', icon: Building },
                        { id: 'fiscal', label: 'Fiscal / eTIMS', icon: FileText },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 border-l-4 transition ${
                                activeTab === tab.id ? 'bg-white border-masuma-orange text-masuma-orange' : 'border-transparent text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-8">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold uppercase text-masuma-dark mb-6 pb-2 border-b border-gray-100">General Configuration</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">Company Name</label>
                                    <input type="text" defaultValue="Masuma Autoparts East Africa Ltd" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">Default Currency</label>
                                    <input type="text" defaultValue="KES" disabled className="w-full p-3 border border-gray-200 bg-gray-100 rounded text-gray-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Support Email</label>
                                <input type="email" defaultValue="support@masuma.co.ke" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'branch' && (
                         <div className="space-y-6">
                            <h3 className="text-lg font-bold uppercase text-masuma-dark mb-6 pb-2 border-b border-gray-100">Branch Information</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Branch Name</label>
                                <input type="text" defaultValue="Nairobi Industrial Area HQ" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Physical Address</label>
                                <textarea defaultValue="Godown 4, Enterprise Road, Nairobi" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-24 resize-none"></textarea>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Phone Number (For Receipts)</label>
                                <input type="text" defaultValue="+254 700 123 456" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                            </div>
                         </div>
                    )}

                    {activeTab === 'fiscal' && (
                        <div className="space-y-6">
                           <h3 className="text-lg font-bold uppercase text-masuma-dark mb-6 pb-2 border-b border-gray-100">KRA eTIMS Settings</h3>
                           <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
                               <p className="text-xs text-yellow-800"><strong>Warning:</strong> Changing these settings will affect fiscal signature generation.</p>
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs font-bold uppercase text-gray-500">KRA PIN</label>
                               <input type="text" defaultValue="P051234567Z" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono" />
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs font-bold uppercase text-gray-500">Device Serial Number</label>
                               <input type="text" defaultValue="KRA-VSCU-001-992" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono" />
                           </div>
                           <div className="flex items-center gap-3 mt-4">
                               <input type="checkbox" defaultChecked className="w-5 h-5 text-masuma-orange rounded focus:ring-masuma-orange" />
                               <span className="text-sm font-bold text-gray-700">Enable Automatic Invoice Signing</span>
                           </div>
                        </div>
                   )}
                </div>
            </div>
        </div>
    );
};

export default SettingsManager;
