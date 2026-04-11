import React, { useState, useEffect } from 'react';
import { 
  Ship, Package, CheckCircle2, Clock, 
  MapPin, FileText, DollarSign, Calendar,
  ChevronRight, AlertCircle, ExternalLink,
  Anchor, Truck, Key, Search
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { ImportRequest } from '../types';
import { motion } from 'framer-motion';

const ImportTracking: React.FC = () => {
  const [requests, setRequests] = useState<ImportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const res = await apiClient.get('/import-requests/my');
      setRequests(res.data);
    } catch (e) {
      console.error('Error fetching my import requests', e);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'PENDING', label: 'Request Received', icon: Clock },
    { id: 'SOURCING', label: 'Sourcing Vehicle', icon: Search },
    { id: 'QUOTED', label: 'Official Quote', icon: FileText },
    { id: 'CIF_PAID', label: 'CIF Paid', icon: DollarSign },
    { id: 'SHIPPING_LOADED', label: 'Shipment Loaded', icon: Anchor },
    { id: 'IN_TRANSIT', label: 'In Transit', icon: Ship },
    { id: 'ARRIVED', label: 'Arrived at Port', icon: MapPin },
    { id: 'CLEARING', label: 'KRA Clearance', icon: Package },
    { id: 'BALANCE_DUE', label: 'Balance Due', icon: DollarSign },
    { id: 'READY_FOR_COLLECTION', label: 'Ready for Collection', icon: Key },
    { id: 'COMPLETED', label: 'Delivered', icon: CheckCircle2 },
  ];

  const getActiveStepIndex = (status: string) => {
    return steps.findIndex(s => s.id === status);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-100">
        <Ship className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No active imports</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          When you request our concierge import service, you'll be able to track every step of your vehicle's journey here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {requests.map(req => {
        const activeIndex = getActiveStepIndex(req.status);
        
        return (
          <div key={req.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 md:p-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Ship className="w-8 h-8 text-masuma-orange" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">
                      {req.make} {req.model}
                    </h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Request ID: {req.id.split('-')[0]} • {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="bg-masuma-orange px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-masuma-orange/20">
                  {steps[activeIndex]?.label || req.status}
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="p-6 md:p-8 border-b border-gray-50 overflow-x-auto">
              <div className="min-w-[800px] relative flex justify-between">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-0" />
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-masuma-orange transition-all duration-1000 -z-0" 
                  style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = idx < activeIndex;
                  const isActive = idx === activeIndex;
                  
                  return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center group">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                        ${isCompleted ? 'bg-masuma-orange text-white' : 
                          isActive ? 'bg-white border-4 border-masuma-orange text-masuma-orange scale-125 shadow-xl' : 
                          'bg-white border-2 border-gray-100 text-gray-300'}
                      `}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className={`
                        mt-4 text-[10px] font-black uppercase tracking-widest text-center max-w-[80px]
                        ${isActive ? 'text-gray-900' : 'text-gray-400'}
                      `}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Shipping Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-masuma-orange" />
                  Shipping Details
                </h4>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Vessel</span>
                    <span className="text-sm font-black text-gray-900">{req.vesselName || 'TBA'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">ETA Port</span>
                    <span className="text-sm font-black text-gray-900">
                      {req.eta ? new Date(req.eta).toLocaleDateString() : 'TBA'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Source</span>
                    <span className="text-sm font-black text-gray-900">{req.sourceCountry}</span>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-masuma-orange" />
                  Payment Status
                </h4>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">CIF Amount</span>
                    <span className="text-sm font-black text-gray-900">
                      {req.cifAmount ? `KES ${req.cifAmount.toLocaleString()}` : 'Calculating...'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Balance Due</span>
                    <span className="text-sm font-black text-gray-900">
                      {req.balanceAmount ? `KES ${req.balanceAmount.toLocaleString()}` : 'TBA'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Payment Status</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${activeIndex >= 3 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {activeIndex >= 3 ? 'CIF Paid' : 'Pending CIF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-masuma-orange" />
                  Official Documents
                </h4>
                <div className="space-y-2">
                  {req.quoteUrl ? (
                    <a 
                      href={req.quoteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-masuma-orange transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Official Quotation</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-masuma-orange" />
                    </a>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex items-center gap-3 opacity-60">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-bold text-gray-400">Quotation Pending</span>
                    </div>
                  )}

                  {req.contractUrl ? (
                    <a 
                      href={req.contractUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-masuma-orange transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Sales Contract</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-masuma-orange" />
                    </a>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex items-center gap-3 opacity-60">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-bold text-gray-400">Contract Pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Message */}
            {req.adminResponse && (
              <div className="px-6 md:px-8 pb-8">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Latest Update from Concierge</p>
                  <p className="text-sm font-bold text-blue-900">{req.adminResponse}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ImportTracking;
