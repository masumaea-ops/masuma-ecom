
import React, { useState } from 'react';
import { Search, Car, CheckCircle, AlertCircle, X } from 'lucide-react';
import { apiClient } from '../utils/apiClient';

interface VinSearchProps {
  onVehicleIdentified: (vehicleName: string) => void;
}

const VinSearch: React.FC<VinSearchProps> = ({ onVehicleIdentified }) => {
  const [vin, setVin] = useState('');
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [identifiedCar, setIdentifiedCar] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vin.length < 5) return;

    setStatus('searching');
    try {
        const res = await apiClient.get(`/vehicles/decode/${vin}`);
        const car = res.data.model;
        setIdentifiedCar(car);
        setStatus('found');
        onVehicleIdentified(car);
    } catch (error) {
        setStatus('error');
        onVehicleIdentified('');
    }
  };

  const clearSearch = () => {
      setVin('');
      setStatus('idle');
      setIdentifiedCar('');
      onVehicleIdentified('');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-gray-100 mb-6">
      <div className="flex items-center gap-2 mb-3">
          <Car className="text-masuma-orange" size={20} />
          <h3 className="font-bold text-masuma-dark uppercase text-sm tracking-wide">Filter by Chassis / VIN</h3>
      </div>
      
      <div className="relative">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
                <input 
                    type="text" 
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    placeholder="Enter 17-digit VIN (e.g. JTN11...)"
                    className={`w-full pl-4 pr-10 py-2 border rounded outline-none font-mono text-sm uppercase transition ${
                        status === 'found' ? 'border-green-500 bg-green-50 text-green-700' :
                        status === 'error' ? 'border-red-500 bg-red-50' :
                        'border-gray-300 focus:border-masuma-orange'
                    }`}
                    maxLength={17}
                />
                {vin && (
                    <button 
                        type="button"
                        onClick={clearSearch} 
                        className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            <button 
                type="submit"
                disabled={status === 'searching' || !vin}
                className="bg-masuma-dark text-white px-4 py-2 rounded font-bold text-xs uppercase tracking-wider hover:bg-masuma-orange transition disabled:opacity-50"
            >
                {status === 'searching' ? 'Decoding...' : 'Decode'}
            </button>
          </form>
      </div>

      {status === 'found' && (
          <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded border border-green-200 animate-fade-in">
              <CheckCircle size={16} />
              <span className="text-xs font-bold">Vehicle Identified: {identifiedCar}</span>
          </div>
      )}

      {status === 'error' && (
          <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded border border-red-200 animate-fade-in">
              <AlertCircle size={16} />
              <span className="text-xs font-bold">Invalid VIN or Vehicle Not Found in Database.</span>
          </div>
      )}
    </div>
  );
};

export default VinSearch;
