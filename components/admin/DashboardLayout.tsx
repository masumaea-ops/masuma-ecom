
import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, History, 
  Smartphone, Users, FileText, Truck, Car, 
  BarChart3, Briefcase, Settings, LogOut, Menu, X, Bell, Edit, FileBarChart, Shield, Globe
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeModule: string;
  onNavigate: (module: string) => void;
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeModule, onNavigate, onLogout }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
    { id: 'products', label: 'Product Manager', icon: Package },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'shipping', label: 'Shipping & Logistics', icon: Truck },
    { id: 'quotes', label: 'Quotations', icon: FileText },
    { id: 'b2b', label: 'B2B Portal', icon: Briefcase },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales_history', label: 'Sales History', icon: History },
    { id: 'mpesa', label: 'M-Pesa Logs', icon: Smartphone },
    { id: 'customers', label: 'Customers (CRM)', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: Shield },
    { id: 'blog', label: 'Blog Studio', icon: Edit },
    { id: 'cms', label: 'CMS Editor', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-masuma-dark text-white transition-all duration-300 flex flex-col flex-shrink-0`}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          {isSidebarOpen ? (
             <div className="flex flex-col items-center">
                <span className="font-display font-bold text-xl tracking-wider text-masuma-orange">MASUMA</span>
                <span className="text-[9px] text-gray-400 tracking-widest uppercase">Enterprise ERP</span>
             </div>
          ) : (
             <span className="font-display font-bold text-xl text-masuma-orange">M</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center px-4 py-3 transition-colors ${
                activeModule === item.id 
                  ? 'bg-masuma-orange text-white border-r-4 border-white' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
              title={!isSidebarOpen ? item.label : ''}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {isSidebarOpen && (
                <span className="ml-3 text-sm font-medium tracking-wide">{item.label}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center px-2 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-3 text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-masuma-orange">
            <Menu size={24} />
          </button>

          <div className="flex items-center space-x-6">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-masuma-dark uppercase">Branch: Nairobi Industrial</p>
              <p className="text-[10px] text-gray-500">User: Admin</p>
            </div>
            <div className="relative cursor-pointer">
               <Bell size={20} className="text-gray-500" />
               <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <button 
              onClick={() => onNavigate('profile')}
              className="w-8 h-8 bg-masuma-orange rounded-full flex items-center justify-center text-white font-bold text-xs hover:scale-110 transition"
              title="My Profile"
            >
              A
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
