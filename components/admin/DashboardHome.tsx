
import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { ShoppingCart, Package, Users, TrendingUp, AlertTriangle, ArrowUpRight, Loader2, Activity, User, Clock, Plane } from 'lucide-react';
import { apiClient, formatCurrency } from '../../utils/apiClient';
import { DashboardStats } from '../../types';

const COLORS = ['#E0621B', '#1A1A1A', '#F59E0B', '#10B981', '#6366F1', '#EC4899'];

const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  // Additional state for sourcing requests (since it might not be in the base DashboardStats type initially)
  const [sourcingCount, setSourcingCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Parallel fetch
        const [statsRes, logsRes, quotesRes] = await Promise.all([
            apiClient.get('/admin/stats'),
            apiClient.get('/audit-logs'),
            apiClient.get('/quotes') // Quick fetch to filter sourcing type client-side for this specific KPI card
        ]);

        setStats(statsRes.data);
        setActivityLog(logsRes.data.slice(0, 6));
        
        // Calculate sourcing requests
        const sourcing = quotesRes.data.filter((q: any) => q.type === 'SOURCING' && q.status === 'DRAFT').length;
        setSourcingCount(sourcing);

        setUsingFallback(false);
      } catch (err) {
        // Fallback Mock Data for Offline Demo
        setStats({
          totalSales: 254300,
          lowStockItems: 3,
          todaysOrders: 12,
          pendingQuotes: 5,
          monthlyRevenue: [
            { name: 'Jan', value: 120000 }, { name: 'Feb', value: 150000 },
            { name: 'Mar', value: 180000 }, { name: 'Apr', value: 170000 },
            { name: 'May', value: 210000 }, { name: 'Jun', value: 254300 }
          ],
          categorySales: [
            { name: 'Filters', value: 40 }, { name: 'Brakes', value: 30 },
            { name: 'Suspension', value: 20 }, { name: 'Engine', value: 10 }
          ]
        });
        setSourcingCount(2);
        setUsingFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 text-masuma-dark">
          <Loader2 size={40} className="animate-spin text-masuma-orange" />
          <p className="text-sm font-bold uppercase tracking-widest">Loading Insights...</p>
        </div>
      </div>
    );
  }

  // Fallback for graph data
  const lineData = stats?.monthlyRevenue?.length ? stats.monthlyRevenue : [{ name: 'No Data', value: 0 }];
  const pieData = stats?.categorySales?.length ? stats.categorySales : [{ name: 'No Data', value: 1 }];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Executive Overview</h2>
        <div className="flex items-center gap-4">
            {usingFallback && (
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold uppercase border border-orange-200">Offline Mode</span>
            )}
            <div className="text-xs text-gray-500 font-bold">Last Updated: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Sales', value: formatCurrency(stats?.totalSales || 0), icon: TrendingUp, color: 'bg-green-500', change: 'Today' },
          { label: 'Orders Today', value: stats?.todaysOrders || 0, icon: ShoppingCart, color: 'bg-blue-500', change: 'Live' },
          { label: 'Low Stock', value: stats?.lowStockItems || 0, icon: AlertTriangle, color: 'bg-red-500', change: 'Action Req' },
          { label: 'Pending Quotes', value: stats?.pendingQuotes || 0, icon: Users, color: 'bg-gray-600', change: 'General' },
          { label: 'Sourcing Queue', value: sourcingCount, icon: Plane, color: 'bg-purple-600', change: 'High Priority' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2 rounded-lg text-white shadow-sm ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.change === 'High Priority' ? 'bg-purple-100 text-purple-700' : 'bg-green-50 text-green-600'}`}>
                {stat.change}
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-masuma-dark tracking-tight">{stat.value}</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wide mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-masuma-dark mb-6 uppercase tracking-wide">Revenue Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line type="monotone" dataKey="value" stroke="#E0621B" strokeWidth={3} dot={{r: 4, fill: '#E0621B'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-masuma-dark mb-6 uppercase tracking-wide">Catalog Mix</h3>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-masuma-dark uppercase tracking-wide flex items-center gap-2">
                  <Activity size={20} className="text-masuma-orange" /> Recent Operations
              </h3>
          </div>
          <div className="divide-y divide-gray-50">
              {activityLog.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No recent activity recorded.</div>
              ) : (
                  activityLog.map((log, i) => (
                      <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                          <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                  log.type === 'error' ? 'bg-red-100 text-red-600' : 
                                  log.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                  {log.user.charAt(0)}
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-gray-800">{log.action.replace(/_/g, ' ')}</p>
                                  <p className="text-xs text-gray-500">{log.detail}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock size={10} /> {log.time}
                              </div>
                              <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mt-0.5">{log.user}</div>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
    </div>
  );
};

export default DashboardHome;
