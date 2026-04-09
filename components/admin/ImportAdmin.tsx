import React, { useState, useEffect } from 'react';
import { 
  Ship, Globe, User, Calendar, 
  DollarSign, Clock, Search, Filter,
  CheckCircle2, AlertCircle, ArrowRight,
  MessageSquare, Edit3, Save, X
} from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { ImportRequest } from '../../types';

const ImportAdmin: React.FC = () => {
  const [requests, setRequests] = useState<ImportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ status: '', adminResponse: '' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/import-requests');
      setRequests(res.data);
    } catch (e) {
      console.error('Error fetching import requests', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (req: ImportRequest) => {
    setEditingId(req.id);
    setEditData({ 
      status: req.status, 
      adminResponse: typeof req.adminResponse === 'string' ? req.adminResponse : JSON.stringify(req.adminResponse || '') 
    });
  };

  const handleSave = async (id: string) => {
    try {
      await apiClient.patch(`/import-requests/${id}`, editData);
      setEditingId(null);
      fetchRequests();
    } catch (e) {
      console.error('Error saving import request', e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'SOURCING': return 'bg-blue-100 text-blue-700';
      case 'QUOTED': return 'bg-purple-100 text-purple-700';
      case 'DEPOSIT_PAID': return 'bg-indigo-100 text-indigo-700';
      case 'SHIPPED': return 'bg-orange-100 text-orange-700';
      case 'CLEARING': return 'bg-cyan-100 text-cyan-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Concierge Requests</h1>
          <p className="text-gray-500">Manage vehicle sourcing and import pipelines.</p>
        </div>
        <button onClick={fetchRequests} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <Clock className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1,2].map(i => <div key={i} className="bg-white rounded-xl h-48 animate-pulse" />)
        ) : requests.length > 0 ? (
          requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4">
                      <Ship className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{req.make} {req.model} ({req.minYear}+)</h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <User className="w-3.5 h-3.5 mr-1" />
                        {req.user?.fullName} • {req.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Budget</p>
                    <p className="text-sm font-bold text-gray-900">KES {req.budgetKes.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Source</p>
                    <p className="text-sm font-bold text-gray-900">{req.sourceCountry}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Mileage Preference</p>
                    <p className="text-sm font-bold text-gray-900">{req.maxMileage?.toLocaleString() || 'Any'} KM</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Color</p>
                    <p className="text-sm font-bold text-gray-900">{req.colorPreference || 'Any'}</p>
                  </div>
                </div>

                {req.additionalNotes && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-800 mb-1 flex items-center">
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      Customer Notes
                    </p>
                    <p className="text-sm text-blue-900">{req.additionalNotes}</p>
                  </div>
                )}

                {editingId === req.id ? (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Update Status</label>
                        <select 
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          className="w-full rounded-lg border-gray-300 text-sm"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="SOURCING">Sourcing</option>
                          <option value="QUOTED">Quoted</option>
                          <option value="DEPOSIT_PAID">Deposit Paid</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="CLEARING">Clearing</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Response / Quote Details</label>
                        <textarea 
                          value={editData.adminResponse}
                          onChange={(e) => setEditData({ ...editData, adminResponse: e.target.value })}
                          className="w-full rounded-lg border-gray-300 text-sm"
                          rows={3}
                          placeholder="Enter quote details, ship name, or updates..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSave(req.id)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500 italic">
                      {req.adminResponse ? 'Response sent to customer' : 'No response yet'}
                    </div>
                    <button 
                      onClick={() => handleStartEdit(req)}
                      className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800"
                    >
                      <Edit3 className="w-4 h-4 mr-1.5" />
                      Manage Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
            <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No import requests</h3>
            <p className="text-gray-500">New requests from the concierge service will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportAdmin;
