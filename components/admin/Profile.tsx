
import React, { useState } from 'react';
import { User, Mail, Lock, Save, Shield, Activity, MapPin } from 'lucide-react';

const Profile: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">My Profile</h2>
          <p className="text-sm text-gray-500">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-center">
            <div className="h-32 bg-masuma-dark"></div>
            <div className="px-6 pb-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white mx-auto -mt-12 flex items-center justify-center text-2xl font-bold text-gray-500 mb-4">
                A
              </div>
              <h3 className="text-xl font-bold text-masuma-dark">Admin User</h3>
              <p className="text-sm text-gray-500 mb-4">Senior Store Manager</p>
              
              <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase text-green-600 bg-green-50 py-2 rounded mb-6">
                <Shield size={14} /> Administrator
              </div>

              <div className="text-left space-y-3 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={16} className="text-masuma-orange" /> admin@masuma.co.ke
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-masuma-orange" /> Nairobi HQ
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Activity size={16} className="text-masuma-orange" /> Last Login: Just now
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="font-bold text-masuma-dark uppercase border-b border-gray-100 pb-2 mb-6 flex items-center gap-2">
              <User size={18} /> Account Details
            </h3>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">First Name</label>
                  <input type="text" defaultValue="Admin" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Last Name</label>
                  <input type="text" defaultValue="User" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">Email Address</label>
                <input type="email" defaultValue="admin@masuma.co.ke" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none bg-gray-50 cursor-not-allowed" disabled />
              </div>

              <div className="pt-6">
                <h3 className="font-bold text-masuma-dark uppercase border-b border-gray-100 pb-2 mb-6 flex items-center gap-2">
                  <Lock size={18} /> Security
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Current Password</label>
                    <input type="password" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">New Password</label>
                    <input type="password" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-gray-500">Confirm New Password</label>
                    <input type="password" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-masuma-dark text-white px-8 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-masuma-orange transition shadow-lg flex items-center gap-2 disabled:opacity-70"
                >
                  <Save size={18} /> {isSaving ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
