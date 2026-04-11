import React, { useState } from 'react';
import { 
  Plus, Image as ImageIcon, X, Car, Bike, 
  MapPin, DollarSign, Calendar, Gauge, Fuel, 
  Settings2, Info, AlertCircle, CheckCircle2, FileText, Upload
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { ListingStatus, VehicleType } from '../types';

interface VehicleListingFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const VehicleListingForm: React.FC<VehicleListingFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState(initialData || {
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    mileage: 0,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    engineSize: 1500,
    bodyType: 'Sedan',
    color: '',
    description: '',
    vehicleType: 'CAR' as 'CAR' | 'MOTORCYCLE',
    location: 'Nairobi',
    vin: '',
    images: [] as string[],
    scanReportUrl: '',
    auctionSheetUrl: '',
    isImported: false
  });

  const [imageUrl, setImageUrl] = useState('');
  const [uploadingReport, setUploadingReport] = useState(false);
  const [uploadingAuctionSheet, setUploadingAuctionSheet] = useState(false);

  const handleAddImage = () => {
    if (imageUrl && !formData.images.includes(imageUrl)) {
      setFormData({ ...formData, images: [...formData.images, imageUrl] });
      setImageUrl('');
    }
  };

  const removeImage = (url: string) => {
    setFormData({ ...formData, images: formData.images.filter(img => img !== url) });
  };

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file for the scan report.');
      return;
    }

    setUploadingReport(true);
    setError(null);

    const uploadFormData = new FormData();
    uploadFormData.append('report', file);

    try {
      const res = await apiClient.post('/upload/report', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, scanReportUrl: res.data.url });
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to upload report');
    } finally {
      setUploadingReport(false);
    }
  };

  const handleAuctionSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file for the auction sheet.');
      return;
    }

    setUploadingAuctionSheet(true);
    setError(null);

    const uploadFormData = new FormData();
    uploadFormData.append('report', file); // Reusing the same backend field name if it's generic enough, or I should check upload routes

    try {
      const res = await apiClient.post('/upload/report', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, auctionSheetUrl: res.data.url });
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to upload auction sheet');
    } finally {
      setUploadingAuctionSheet(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (initialData?.id) {
        await apiClient.patch(`/marketplace/${initialData.id}`, formData);
      } else {
        await apiClient.post('/marketplace', formData);
      }
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Submitted!</h2>
        <p className="text-gray-500">Your vehicle listing has been submitted for review. It will be live shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-4xl mx-auto border border-gray-100">
      <div className="bg-masuma-dark p-8 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black font-display uppercase tracking-wider">List Your Vehicle</h2>
          <p className="text-gray-400 text-sm font-medium">Reach thousands of verified buyers in Kenya.</p>
        </div>
        <button onClick={onCancel} className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-8 h-8" />
        </button>
        <Car className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
      </div>

      <form onSubmit={handleSubmit} className="p-10">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-5 rounded-2xl mb-8 flex items-center animate-shake">
            <AlertCircle className="w-6 h-6 mr-3 shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Basic Info */}
          <div className="space-y-8">
            <h3 className="text-sm font-black text-masuma-dark uppercase tracking-[0.2em] border-b border-gray-100 pb-3 flex items-center">
              <Info className="w-5 h-5 mr-3 text-masuma-orange" />
              Basic Information
            </h3>
            
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, vehicleType: 'CAR' })}
                className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${formData.vehicleType === 'CAR' ? 'border-masuma-orange bg-masuma-orange/5 text-masuma-orange shadow-lg shadow-masuma-orange/10' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                <Car className="w-6 h-6 mb-1" />
                <span className="text-xs font-black uppercase tracking-widest">Car</span>
              </button>
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, vehicleType: 'MOTORCYCLE' })}
                className={`flex-1 py-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${formData.vehicleType === 'MOTORCYCLE' ? 'border-masuma-orange bg-masuma-orange/5 text-masuma-orange shadow-lg shadow-masuma-orange/10' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                <Bike className="w-6 h-6 mb-1" />
                <span className="text-xs font-black uppercase tracking-widest">Motorcycle</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Listing Title</label>
                <input 
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 2018 Toyota Land Cruiser Prado"
                  className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Make</label>
                  <input 
                    type="text"
                    required
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    placeholder="Toyota"
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Model</label>
                  <input 
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Prado"
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Year</label>
                  <input 
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Price (KES)</label>
                  <input 
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-masuma-orange w-4 h-4" />
                  <input 
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-12 rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <label className="flex items-center gap-4 cursor-pointer group bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-masuma-orange/30 transition-all">
                <div className="relative">
                  <input 
                    type="checkbox"
                    checked={formData.isImported}
                    onChange={(e) => setFormData({ ...formData, isImported: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-masuma-orange"></div>
                </div>
                <div>
                  <span className="block text-xs font-black text-masuma-dark uppercase tracking-widest group-hover:text-masuma-orange transition-colors">Imported Unit</span>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Ex-Japan / UK / etc</span>
                </div>
              </label>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="space-y-8">
            <h3 className="text-sm font-black text-masuma-dark uppercase tracking-[0.2em] border-b border-gray-100 pb-3 flex items-center">
              <Settings2 className="w-5 h-5 mr-3 text-masuma-orange" />
              Technical Specs
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mileage (KM)</label>
                  <input 
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Engine CC</label>
                  <input 
                    type="number"
                    value={formData.engineSize}
                    onChange={(e) => setFormData({ ...formData, engineSize: Number(e.target.value) })}
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fuel Type</label>
                  <select 
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all appearance-none"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Transmission</label>
                  <select 
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all appearance-none"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">VIN Number</label>
                <input 
                  type="text"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                  placeholder="17-character VIN"
                  className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Documents</label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <input 
                        type="file"
                        accept=".pdf"
                        onChange={handleReportUpload}
                        className="hidden"
                        id="report-upload"
                      />
                      <label 
                        htmlFor="report-upload"
                        className={`w-full flex items-center justify-between py-3 px-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${formData.scanReportUrl ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 hover:border-masuma-orange/30 text-gray-400'}`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className={`w-5 h-5 ${formData.scanReportUrl ? 'text-green-600' : 'text-gray-300'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Scan Report (PDF)</span>
                        </div>
                        {uploadingReport ? (
                          <div className="w-4 h-4 border-2 border-masuma-orange border-t-transparent rounded-full animate-spin" />
                        ) : formData.scanReportUrl ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </label>
                    </div>

                    {formData.isImported && (
                      <div className="relative">
                        <input 
                          type="file"
                          accept=".pdf"
                          onChange={handleAuctionSheetUpload}
                          className="hidden"
                          id="auction-sheet-upload"
                        />
                        <label 
                          htmlFor="auction-sheet-upload"
                          className={`w-full flex items-center justify-between py-3 px-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${formData.auctionSheetUrl ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 hover:border-masuma-orange/30 text-gray-400'}`}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className={`w-5 h-5 ${formData.auctionSheetUrl ? 'text-purple-600' : 'text-gray-300'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Auction Sheet (PDF)</span>
                          </div>
                          {uploadingAuctionSheet ? (
                            <div className="w-4 h-4 border-2 border-masuma-orange border-t-transparent rounded-full animate-spin" />
                          ) : formData.auctionSheetUrl ? (
                            <CheckCircle2 className="w-5 h-5 text-purple-500" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Images (URLs)</label>
                <div className="flex gap-3 mb-4">
                  <input 
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL"
                    className="flex-grow rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  />
                  <button 
                    type="button"
                    onClick={handleAddImage}
                    className="bg-masuma-dark text-white p-4 rounded-2xl hover:bg-black transition-all shadow-lg"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {formData.images.map(img => (
                    <div key={img} className="relative w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 group">
                      <img src={img} alt="Vehicle" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <button 
                        type="button"
                        onClick={() => removeImage(img)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
          <textarea 
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the condition, history, and features..."
            className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-5 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
          />
        </div>

        <div className="mt-12 flex gap-6">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 py-5 border border-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="flex-[2] py-5 bg-masuma-orange text-white rounded-2xl font-black uppercase tracking-widest hover:bg-masuma-orange-dark transition-all disabled:bg-gray-200 shadow-xl shadow-masuma-orange/20"
          >
            {loading ? 'Submitting...' : 'Post Vehicle Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleListingForm;
