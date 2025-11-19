
import React, { useState, useEffect } from 'react';
import { Save, Layout, Megaphone, Image as ImageIcon, Check, Loader2, FileText, Phone, MapPin, Mail, Columns } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

const CmsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'hero' | 'announcement' | 'layout'>('hero');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const [config, setConfig] = useState({
        CMS_HERO_TITLE: 'JAPANESE PRECISION.\nKENYAN GRIT.',
        CMS_HERO_SUBTITLE: 'Upgrade your ride with parts engineered to survive Nairobi\'s toughest roads.',
        CMS_HERO_IMAGE: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
        CMS_ANNOUNCEMENT_TEXT: 'Free delivery in Nairobi CBD for orders over KES 5,000',
        CMS_ANNOUNCEMENT_ENABLED: 'true',
        CMS_ANNOUNCEMENT_COLOR: '#E0621B',
        // Layout / Header / Footer
        CMS_HEADER_PHONE: '+254 792 506590',
        CMS_FOOTER_ABOUT: 'Masuma Autoparts East Africa Limited. The official distributor of certified Masuma components. Engineering you can trust for the African road.',
        CMS_CONTACT_ADDRESS: 'Godown 4, Enterprise Road, Industrial Area, Nairobi',
        CMS_CONTACT_EMAIL: 'sales@masuma.co.ke',
        CMS_CONTACT_PHONE: '+254 700 123 456'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiClient.get('/settings');
                // Merge remote settings with defaults
                if (res.data) {
                    setConfig(prev => ({ ...prev, ...res.data }));
                }
            } catch (error) {
                console.error('Failed to load CMS settings', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (key: string, value: string) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.post('/settings', config);
            // showToast('CMS Updated', 'success'); 
        } catch (error) {
            alert('Failed to save changes');
        } finally {
            setTimeout(() => setIsSaving(false), 1000);
        }
    };

    if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-masuma-orange" /></div>;

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row flex-1 min-h-[500px]">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 flex md:flex-col overflow-x-auto md:overflow-visible">
                    <button 
                        onClick={() => setActiveTab('hero')}
                        className={`w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 whitespace-nowrap ${activeTab === 'hero' ? 'bg-white text-masuma-orange border-l-4 border-masuma-orange' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Layout size={18} /> Hero Section
                    </button>
                    <button 
                        onClick={() => setActiveTab('announcement')}
                        className={`w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 whitespace-nowrap ${activeTab === 'announcement' ? 'bg-white text-masuma-orange border-l-4 border-masuma-orange' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Megaphone size={18} /> Announcement Bar
                    </button>
                    <button 
                        onClick={() => setActiveTab('layout')}
                        className={`w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 whitespace-nowrap ${activeTab === 'layout' ? 'bg-white text-masuma-orange border-l-4 border-masuma-orange' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Columns size={18} /> Header & Footer
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'hero' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-lg uppercase text-masuma-dark border-b border-gray-100 pb-2 mb-6">Homepage Hero Configuration</h3>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Main Headline (Use \n for new lines)</label>
                                <textarea 
                                    value={config.CMS_HERO_TITLE} 
                                    onChange={e => handleChange('CMS_HERO_TITLE', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-display font-bold text-lg h-24" 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Subheading Text</label>
                                <textarea 
                                    value={config.CMS_HERO_SUBTITLE}
                                    onChange={e => handleChange('CMS_HERO_SUBTITLE', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-24 resize-none"
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Background Image URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={config.CMS_HERO_IMAGE}
                                        onChange={e => handleChange('CMS_HERO_IMAGE', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none text-sm text-gray-400" 
                                    />
                                    <button className="p-3 bg-gray-100 rounded text-gray-600 hover:bg-gray-200"><ImageIcon size={20} /></button>
                                </div>
                                <div className="mt-2 h-32 w-full bg-gray-100 rounded overflow-hidden relative">
                                    <img src={config.CMS_HERO_IMAGE} alt="Preview" className="w-full h-full object-cover opacity-50" />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase text-gray-500">Preview</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'announcement' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-lg uppercase text-masuma-dark border-b border-gray-100 pb-2 mb-6">Top Bar Announcement</h3>
                            
                            <div className="flex items-center gap-3 mb-4">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 text-masuma-orange rounded focus:ring-masuma-orange" 
                                    checked={config.CMS_ANNOUNCEMENT_ENABLED === 'true'}
                                    onChange={e => handleChange('CMS_ANNOUNCEMENT_ENABLED', String(e.target.checked))}
                                />
                                <span className="text-sm font-bold text-gray-700">Enable Announcement Bar</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Message</label>
                                <input 
                                    type="text" 
                                    value={config.CMS_ANNOUNCEMENT_TEXT}
                                    onChange={e => handleChange('CMS_ANNOUNCEMENT_TEXT', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Background Color (Hex)</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded border border-gray-200" style={{ backgroundColor: config.CMS_ANNOUNCEMENT_COLOR }}></div>
                                    <input 
                                        type="text" 
                                        value={config.CMS_ANNOUNCEMENT_COLOR}
                                        onChange={e => handleChange('CMS_ANNOUNCEMENT_COLOR', e.target.value)}
                                        className="w-32 p-2 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'layout' && (
                        <div className="space-y-6">
                             <h3 className="font-bold text-lg uppercase text-masuma-dark border-b border-gray-100 pb-2 mb-6">Header & Footer Details</h3>
                             
                             <div className="space-y-2">
                                 <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Phone size={14}/> Header Phone Number</label>
                                 <input 
                                     type="text" 
                                     value={config.CMS_HEADER_PHONE}
                                     onChange={e => handleChange('CMS_HEADER_PHONE', e.target.value)}
                                     className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none"
                                     placeholder="+254 700..."
                                 />
                                 <p className="text-[10px] text-gray-400">Appears in the top dark bar of the website.</p>
                             </div>

                             <hr className="border-gray-100 my-4" />
                             
                             <div className="space-y-2">
                                 <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><FileText size={14}/> Footer About Text</label>
                                 <textarea 
                                     value={config.CMS_FOOTER_ABOUT}
                                     onChange={e => handleChange('CMS_FOOTER_ABOUT', e.target.value)}
                                     className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-24 resize-none"
                                     placeholder="Brief company description..."
                                 ></textarea>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><MapPin size={14}/> Footer Address</label>
                                    <input 
                                        type="text" 
                                        value={config.CMS_CONTACT_ADDRESS}
                                        onChange={e => handleChange('CMS_CONTACT_ADDRESS', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Mail size={14}/> Footer Email</label>
                                    <input 
                                        type="text" 
                                        value={config.CMS_CONTACT_EMAIL}
                                        onChange={e => handleChange('CMS_CONTACT_EMAIL', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Phone size={14}/> Footer Phone</label>
                                    <input 
                                        type="text" 
                                        value={config.CMS_CONTACT_PHONE}
                                        onChange={e => handleChange('CMS_CONTACT_PHONE', e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none"
                                    />
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
