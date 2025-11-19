
import React, { useState } from 'react';
import { FileBarChart, Download, Calendar, TrendingUp, Package, DollarSign, PieChart, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

const ReportsManager: React.FC = () => {
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadReport = async (reportType: string) => {
        setIsDownloading(true);
        try {
            const token = localStorage.getItem('masuma_auth_token');
            let endpoint = '';

            if (reportType === 'Sales_Summary') {
                endpoint = `${apiClient.defaults.baseURL}/reports/sales?startDate=2023-01-01`; // Example date range
            } else if (reportType === 'Inventory_Valuation') {
                endpoint = `${apiClient.defaults.baseURL}/reports/inventory`;
            } else {
                alert('This report type is currently being engineered.');
                setIsDownloading(false);
                return;
            }

            // Trigger browser download directly using fetch to handle auth headers
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}_${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            alert('Failed to generate report. Please try again.');
            console.error(error);
        } finally {
            setIsDownloading(false);
        }
    };

    const reports = [
        { title: 'Sales Summary', desc: 'Daily, weekly, and monthly sales revenue breakdown.', icon: TrendingUp, color: 'bg-blue-500' },
        { title: 'Inventory Valuation', desc: 'Current stock value based on cost vs retail price.', icon: Package, color: 'bg-purple-500' },
        { title: 'VAT / Tax Report', desc: 'KRA output tax (16%) summary for filing returns.', icon: FileBarChart, color: 'bg-green-500' },
        { title: 'Product Performance', desc: 'Best selling items and slow-moving inventory.', icon: PieChart, color: 'bg-orange-500' },
        { title: 'Profit & Loss', desc: 'Estimated gross profit based on sales cost.', icon: DollarSign, color: 'bg-red-500' },
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Reports Center</h2>
                    <p className="text-sm text-gray-500">Generate financial and operational insights.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report, i) => (
                    <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition group">
                        <div className={`w-12 h-12 rounded-lg ${report.color} text-white flex items-center justify-center mb-4 shadow-sm`}>
                            <report.icon size={24} />
                        </div>
                        <h3 className="font-bold text-masuma-dark text-lg mb-2">{report.title}</h3>
                        <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{report.desc}</p>
                        
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex-1 relative">
                                <Calendar size={14} className="absolute left-2 top-2.5 text-gray-400" />
                                <select className="w-full pl-7 py-2 border border-gray-200 rounded text-xs font-bold text-gray-600 bg-gray-50 outline-none">
                                    <option>Last 7 Days</option>
                                    <option>This Month</option>
                                    <option>Last Month</option>
                                    <option>Year to Date</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={() => downloadReport(report.title.replace(/\s/g, '_'))}
                            disabled={isDownloading}
                            className="w-full py-2 border-2 border-gray-100 text-gray-600 font-bold uppercase text-xs rounded hover:border-masuma-dark hover:text-masuma-dark transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                            Export CSV
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-12 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold uppercase text-masuma-dark mb-4">Scheduled Reports</h3>
                <div className="overflow-hidden rounded border border-gray-200">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold">
                            <tr>
                                <th className="px-6 py-3">Report Name</th>
                                <th className="px-6 py-3">Frequency</th>
                                <th className="px-6 py-3">Recipients</th>
                                <th className="px-6 py-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="px-6 py-4 font-bold">Daily Sales EOD</td>
                                <td className="px-6 py-4">Daily @ 6:00 PM</td>
                                <td className="px-6 py-4 text-gray-500">director@masuma.co.ke, accounts@masuma.co.ke</td>
                                <td className="px-6 py-4 text-right"><span className="text-green-600 font-bold text-xs uppercase bg-green-50 px-2 py-1 rounded">Active</span></td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-bold">Monthly Stocktake</td>
                                <td className="px-6 py-4">Monthly (Last Day)</td>
                                <td className="px-6 py-4 text-gray-500">inventory@masuma.co.ke</td>
                                <td className="px-6 py-4 text-right"><span className="text-green-600 font-bold text-xs uppercase bg-green-50 px-2 py-1 rounded">Active</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsManager;
