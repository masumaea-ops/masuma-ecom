
import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { ShoppingCart, Package, Users, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react';

const data = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 2000 },
  { name: 'Apr', sales: 2780 },
  { name: 'May', sales: 1890 },
  { name: 'Jun', sales: 2390 },
  { name: 'Jul', sales: 3490 },
];

const pieData = [
  { name: 'Brakes', value: 400 },
  { name: 'Filters', value: 300 },
  { name: 'Suspension', value: 300 },
  { name: 'Engine', value: 200 },
];

const COLORS = ['#E0621B', '#1A1A1A', '#F59E0B', '#10B981'];

const DashboardHome: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Executive Overview</h2>
        <div className="text-xs text-gray-500 font-bold">Last Updated: {new Date().toLocaleString()}</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: 'KES 1.2M', icon: TrendingUp, color: 'bg-green-500', change: '+12%' },
          { label: 'Active Orders', value: '24', icon: ShoppingCart, color: 'bg-blue-500', change: '+5' },
          { label: 'Low Stock Items', value: '12', icon: AlertTriangle, color: 'bg-red-500', change: '-2' },
          { label: 'New Customers', value: '158', icon: Users, color: 'bg-purple-500', change: '+8%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 transition hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg text-white shadow-sm ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {stat.change} <ArrowUpRight size={12} className="ml-1" />
              </span>
            </div>
            <div>
              <div className="text-3xl font-bold text-masuma-dark tracking-tight">{stat.value}</div>
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wide mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-masuma-dark mb-6 uppercase tracking-wide">Revenue Trend (6 Months)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#E0621B" strokeWidth={3} dot={{r: 4, fill: '#E0621B'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
           <h3 className="text-lg font-bold text-masuma-dark mb-6 uppercase tracking-wide">Sales by Category</h3>
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
                 <Tooltip />
                 <Legend verticalAlign="bottom" height={36} iconType="circle" />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-masuma-dark uppercase tracking-wide">Recent System Activity</h3>
        </div>
        <div className="divide-y divide-gray-100">
           {[
             { action: 'New Order', desc: 'Order #4922 placed by John Doe', time: '2 mins ago' },
             { action: 'Stock Update', desc: 'Added 50 units of MFC-112', time: '15 mins ago' },
             { action: 'System Alert', desc: 'Backup completed successfully', time: '1 hour ago' },
             { action: 'User Login', desc: 'Admin user logged in from 192.168.1.1', time: '2 hours ago' }
           ].map((item, i) => (
             <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
               <div className="flex items-center gap-4">
                 <div className="w-2 h-2 rounded-full bg-masuma-orange"></div>
                 <div>
                   <p className="text-sm font-bold text-gray-800">{item.action}</p>
                   <p className="text-xs text-gray-500">{item.desc}</p>
                 </div>
               </div>
               <span className="text-xs text-gray-400 font-mono">{item.time}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
