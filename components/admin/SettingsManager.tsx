import React, { useState, useEffect } from 'react';
import { Save, Settings, Users, Building, FileText, Loader2, Activity, Server, Database, RefreshCw, Globe, Smartphone, Key, Shield, BarChart3 } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

const SettingsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Health State
    const [healthData, setHealthData] = useState<any>(null);
    const [loadingHealth, setLoadingHealth] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiClient.get('/settings');
                setSettings(res.data);
            } catch (error) {
                console.error('Failed to fetch settings', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (activeTab === 'status') {
            fetchHealth();
        }
    }, [activeTab]);

    const fetchHealth = async () => {
        setLoadingHealth(true);
        try {
            const res = await apiClient.get('/health');
            setHealthData(res.data);
        } catch (error) {
            setHealthData({ server: 'Error', database: 'Unreachable', redis: 'Unreachable' });
        } finally {
            setLoadingHealth(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiClient.post('/settings', settings);
            // Update Cache Immediately so Documents reflect changes without reload
            localStorage.setItem('masuma_settings_cache', JSON.stringify(settings));
            alert('Settings saved successfully.');
        } catch (error) {
            alert('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">System Settings</h2>
                    <p className="text-sm text-gray-500">Configure Branch, API Keys, and Fiscal Integrations.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-masuma-dark text-white px-6 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-masuma-orange transition shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                    Save Configuration
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 flex md:flex-col overflow-x-auto md:overflow-visible">
                    {[
                        { id: 'general', label: 'General Config', icon: Settings },
                        { id: 'branch', label: 'Branch Details', icon: Building },
                        { id: 'seo', label: 'SEO & Analytics', icon: BarChart3 },
                        { id: 'integrations', label: 'API Integrations', icon: Globe },
                        { id: 'fiscal', label: 'Fiscal / eTIMS', icon: FileText },
                        { id: 'status', label: 'System Health', icon: Activity },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full text-left px-6 py-4 font-bold text-sm flex items-center gap-3 border-l-4 transition whitespace-nowrap ${
                                activeTab === tab.id ? 'bg-white border-masuma-orange text-masuma-orange' : 'border-transparent text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {/* ... (Previous tabs remain unchanged) ... */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold uppercase text-masuma-dark mb-6 pb-2 border-b border-gray-100">General Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">Company Name</label>
                                    <input type="text" value={settings['COMPANY_NAME'] || ''} onChange={e => handleChange('COMPANY_NAME', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500">Default Currency</label>
                                    <input type="text" value="KES" disabled className="w-full p-3 border border-gray-200 bg-gray-100 rounded text-gray-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Support Email</label>
                                <input type="email" value={settings['SUPPORT_EMAIL'] || ''} onChange={e => handleChange('SUPPORT_EMAIL', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'branch' && (
                         <div className="space-y-6">
                            <h3 className="text-lg font-bold uppercase text-masuma-dark mb-6 pb-2 border-b border-gray-100">Branch Information</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Branch Name</label>
                                <input type="text" value={settings['BRANCH_NAME'] || ''} onChange={e => handleChange('BRANCH_NAME', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Physical Address</label>
                                <textarea value={settings['BRANCH_ADDRESS'] || ''} onChange={e => handleChange('BRANCH_ADDRESS', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-24 resize-none"></textarea>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Phone Number</label>
                                <input type="text" value={settings['BRANCH_PHONE'] || ''} onChange={e => handleChange('BRANCH_PHONE', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                            </div>
                         </div>
                    )}

                    {/* NEW SEO TAB */}
                    {activeTab === 'seo' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold uppercase text-masuma-dark mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                                <BarChart3 size={20} className="text-blue-600"/> SEO & Analytics (Site Kit)
                            </h3>
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
                                <p className="text-xs text-blue-800">
                                    Configure Google integration here. Changes will reflect on the storefront immediately.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Google Analytics 4 (Measurement ID)</label>
                                <input 
                                    type="text" 
                                    value={settings['GOOGLE_ANALYTICS_ID'] || ''} 
                                    onChange={e => handleChange('GOOGLE_ANALYTICS_ID', e.target.value)} 
                                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono" 
                                    placeholder="G-XXXXXXXXXX"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Google Search Console (Verification Meta Tag)</label>
                                <input 
                                    type="text" 
                                    value={settings['GOOGLE_VERIFICATION_TAG'] || ''} 
                                    onChange={e => handleChange('GOOGLE_VERIFICATION_TAG', e.target.value)} 
                                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono" 
                                    placeholder="google-site-verification=..."
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold uppercase text-masuma-dark mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                                    <Smartphone size={20} className="text-green-600"/> Safaricom Daraja (M-Pesa)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-gray-500">Consumer Key</label>
                                        <input type="password" value={settings['MPESA_CONSUMER_KEY'] || ''} onChange={e => handleChange('MPESA_CONSUMER_KEY', e.target.value)} className="w-full p-3 border border-gray-300 rounded font-mono text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-gray-500">Consumer Secret</label>
                                        <input type="password" value={settings['MPESA_CONSUMER_SECRET'] || ''} onChange={e => handleChange('MPESA_CONSUMER_SECRET', e.target.value)} className="w-full p-3 border border-gray-300 rounded font-mono text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-gray-500">Passkey</label>
                                        <input type="password" value={settings['MPESA_PASSKEY'] || ''} onChange={e => handleChange('MPESA_PASSKEY', e.target.value)} className="w-full p-3 border border-gray-300 rounded font-mono text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-gray-500">Shortcode (Paybill/Till)</label>
                                        <input type="text" value={settings['MPESA_SHORTCODE'] || ''} onChange={e => handleChange('MPESA_SHORTCODE', e.target.value)} className="w-full p-3 border border-gray-300 rounded font-mono text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold uppercase text-masuma-dark mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                                    <Key size={20} className="text-blue-600"/> External Services
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-gray-500">VIN Decoder API Key</label>
                                        <input type="password" value={settings['VIN_API_KEY'] || ''} onChange={e => handleChange('VIN_API_KEY', e.target.value)} className="w-full p-3 border border-gray-300 rounded font-mono text-sm" placeholder="e.g. NHTSA or AutoLoop Key" />
                                        <p className="text-[10px] text-gray-400">Used for the Vehicle Identification module.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-gray-500">Google Gemini API Key</label>
                                        <input type="password" value={settings['GEMINI_API_KEY'] || ''} disabled className="w-full p-3 border border-gray-200 bg-gray-100 rounded font-mono text-sm cursor-not-allowed" placeholder="Managed via Environment Variables for Security" />
                                        <p className="text-[10px] text-gray-400">Contact system administrator to update AI keys.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fiscal' && (
                        <div className="space-y-6">
                           <h3 className="text-lg font-bold uppercase text-masuma-dark mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                               <Shield size={20} className="text-purple-600"/> KRA eTIMS Configuration
                           </h3>
                           <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
                               <p className="text-xs text-yellow-800"><strong>Warning:</strong> Changing these settings will affect fiscal signature generation. Ensure the device is online.</p>
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs font-bold uppercase text-gray-500">Tax Payer PIN (P05...)</label>
                               <input type="text" value={settings['KRA_PIN'] || ''} onChange={e => handleChange('KRA_PIN', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono" />
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs font-bold uppercase text-gray-500">Device Serial Number</label>
                               <input type="text" value={settings['DEVICE_SERIAL'] || ''} onChange={e => handleChange('DEVICE_SERIAL', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono" />
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs font-bold uppercase text-gray-500">VSCU API URL</label>
                               <input type="text" value={settings['KRA_API_URL'] || ''} onChange={e => handleChange('KRA_API_URL', e.target.value)} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono" placeholder="https://itax.kra.go.ke/eTIMS/api" />
                           </div>
                        </div>
                   )}

                   {activeTab === 'status' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                                <h3 className="text-lg font-bold uppercase text-masuma-dark">System Health Monitor</h3>
                                <button onClick={fetchHealth} className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-600">
                                    <RefreshCw size={16} className={loadingHealth ? 'animate-spin' : ''} />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded border border-green-200 flex items-start gap-3">
                                    <Server className="text-green-600 mt-1" size={24} />
                                    <div>
                                        <h4 className="font-bold text-green-800 text-sm">API Server</h4>
                                        <p className="text-xs text-green-600">{healthData?.server || 'Checking...'}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">Uptime: {healthData ? (healthData.uptime / 60).toFixed(2) + ' mins' : '...'}</p>
                                    </div>
                                </div>

                                <div className={`p-4 rounded border flex items-start gap-3 ${healthData?.database === 'Connected' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <Database className={`${healthData?.database === 'Connected' ? 'text-green-600' : 'text-red-600'} mt-1`} size={24} />
                                    <div>
                                        <h4 className={`font-bold text-sm ${healthData?.database === 'Connected' ? 'text-green-800' : 'text-red-800'}`}>Primary Database</h4>
                                        <p className={`text-xs ${healthData?.database === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>{healthData?.database || 'Checking...'}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">MySQL 8.0</p>
                                    </div>
                                </div>

                                <div className={`p-4 rounded border flex items-start gap-3 ${healthData?.redis === 'Connected' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <Activity className={`${healthData?.redis === 'Connected' ? 'text-green-600' : 'text-red-600'} mt-1`} size={24} />
                                    <div>
                                        <h4 className={`font-bold text-sm ${healthData?.redis === 'Connected' ? 'text-green-800' : 'text-red-800'}`}>Cache (Redis)</h4>
                                        <p className={`text-xs ${healthData?.redis === 'Connected' ? 'text-green-600' : 'text-red-600'}`}>{healthData?.redis || 'Checking...'}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">BullMQ / Caching</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded border border-blue-200 flex items-start gap-3">
                                    <FileText className="text-blue-600 mt-1" size={24} />
                                    <div>
                                        <h4 className="font-bold text-blue-800 text-sm">Background Workers</h4>
                                        <p className="text-xs text-blue-600">Idle (BullMQ)</p>
                                        <p className="text-[10px] text-gray-500 mt-1">Queue Depth: 0</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                   )}
                </div>
            </div>
        </div>
    );
};

export default SettingsManager;