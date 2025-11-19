
import React, { useState } from 'react';
import { Save, Layout, Megaphone, Image as ImageIcon, Check } from 'lucide-react';

const CmsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'hero' | 'announcement' | 'banners'>('hero');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <div className="max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Frontend Editor</h2>
                    <p className="text-sm text-gray-500">Customize the store appearance without coding.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-masuma-dark text-white px-6 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-masuma-orange transition shadow-lg flex items-center gap-2 disabled:opacity-70"
                >
                    {isSaving ? <Check size={18} /> : <Save size={18} />}
                    {isSaving ? 'Saved!' : 'Publish Changes'}
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex">
                {/* Sidebar Tabs */}
                <div className="w-64 bg-gray-50 border-r border-gray-200">
                    <button 
                        onClick={() => setActiveTab('hero')}
                        className={`w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 ${activeTab === 'hero' ? 'bg-white text-masuma-orange border-l-4 border-masuma-orange' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Layout size={18} /> Hero Section
                    </button>
                    <button 
                        onClick={() => setActiveTab('announcement')}
                        className={`w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 ${activeTab === 'announcement' ? 'bg-white text-masuma-orange border-l-4 border-masuma-orange' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Megaphone size={18} /> Announcement Bar
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8">
                    {activeTab === 'hero' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-lg uppercase text-masuma-dark border-b border-gray-100 pb-2 mb-6">Homepage Hero Configuration</h3>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Main Headline</label>
                                <input type="text" defaultValue="JAPANESE PRECISION. KENYAN GRIT." className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-display font-bold text-lg" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Subheading Text</label>
                                <textarea defaultValue="Upgrade your ride with parts engineered to survive Nairobi's toughest roads." className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-24 resize-none"></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Background Image URL</label>
                                <div className="flex gap-2">
                                    <input type="text" defaultValue="https://images.unsplash.com/..." className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none text-sm text-gray-400" />
                                    <button className="p-3 bg-gray-100 rounded text-gray-600"><ImageIcon size={20} /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'announcement' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-lg uppercase text-masuma-dark border-b border-gray-100 pb-2 mb-6">Top Bar Announcement</h3>
                            
                            <div className="flex items-center gap-3 mb-4">
                                <input type="checkbox" className="w-5 h-5 text-masuma-orange rounded focus:ring-masuma-orange" checked />
                                <span className="text-sm font-bold text-gray-700">Enable Announcement Bar</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Message</label>
                                <input type="text" defaultValue="Free delivery in Nairobi CBD for orders over KES 5,000" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Background Color (Hex)</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-masuma-orange border border-gray-200"></div>
                                    <input type="text" defaultValue="#E0621B" className="w-32 p-2 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CmsManager;
