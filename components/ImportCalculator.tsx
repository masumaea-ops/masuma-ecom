import React, { useState, useEffect } from 'react';
import { 
  Calculator, Info, AlertTriangle, CheckCircle2, 
  ChevronRight, Download, Share2, Car, Search,
  ArrowRight, ShieldCheck, TrendingUp, Settings
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { CrspData, ImportCalculationResult, Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ImportServiceForm from './ImportServiceForm';

interface ImportCalculatorProps {
  user?: any;
  setView?: (view: any) => void;
}

const ImportCalculator: React.FC<ImportCalculatorProps> = ({ user, setView }) => {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [vehicleType, setVehicleType] = useState('CAR');
  
  const [crspList, setCrspList] = useState<CrspData[]>([]);
  const [selectedCrsp, setSelectedCrsp] = useState<CrspData | null>(null);
  
  const [engineSize, setEngineSize] = useState<number>(1500);
  const [fuelType, setFuelType] = useState('Petrol');
  const [cifValue, setCifValue] = useState<number>(0);
  
  const [result, setResult] = useState<ImportCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [recommendedParts, setRecommendedParts] = useState<Product[]>([]);
  const [isImportServiceOpen, setIsImportServiceOpen] = useState(false);

  useEffect(() => {
    fetchCrspData();
  }, []);

  const fetchCrspData = async () => {
    try {
      const res = await apiClient.get('/import-calculator/crsp');
      const data: CrspData[] = res.data;
      setCrspList(data);
      
      const uniqueMakes = Array.from(new Set(data.map(d => d.make))).sort();
      setMakes(uniqueMakes);
    } catch (e) {
      console.error('Error fetching CRSP data', e);
    }
  };

  useEffect(() => {
    if (selectedMake) {
      const filteredModels = Array.from(new Set(crspList.filter(d => d.make === selectedMake).map(d => d.model))).sort();
      setModels(filteredModels);
      setSelectedModel('');
    }
  }, [selectedMake, crspList]);

  useEffect(() => {
    if (selectedMake && selectedModel) {
      const filteredYears = Array.from(new Set(crspList.filter(d => d.make === selectedMake && d.model === selectedModel).map(d => d.year))).sort((a, b) => b - a);
      setYears(filteredYears);
      if (filteredYears.length > 0) setSelectedYear(filteredYears[0]);
    }
  }, [selectedMake, selectedModel, crspList]);

  useEffect(() => {
    if (selectedMake && selectedModel && selectedYear) {
      const crsp = crspList.find(d => d.make === selectedMake && d.model === selectedModel && d.year === selectedYear);
      if (crsp) {
        setSelectedCrsp(crsp);
        if (crsp.engineSize) setEngineSize(Number(crsp.engineSize));
        if (crsp.fuelType) setFuelType(crsp.fuelType);
      }
    }
  }, [selectedMake, selectedModel, selectedYear, crspList]);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/import-calculator/calculate', {
        crspId: selectedCrsp?.id,
        yearOfManufacture: selectedYear,
        engineSize,
        fuelType,
        vehicleType,
        cifValue: cifValue > 0 ? cifValue : undefined
      });
      setResult(res.data);
      fetchRecommendations();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      // Fetch parts compatible with the selected make/model
      const res = await apiClient.get(`/products?search=${selectedMake} ${selectedModel}`);
      setRecommendedParts(res.data.slice(0, 4));
    } catch (e) {
      console.error('Error fetching recommendations', e);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">KRA Import Cost Calculator</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Calculate accurate vehicle import duties and taxes for Kenya using real CRSP data. 
          Our engine stays updated with the latest KRA regulations.
        </p>
        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setView?.('DASHBOARD')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage CRSP Data (Admin)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Car className="w-5 h-5 mr-2 text-orange-600" />
              Vehicle Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Category</label>
                <select 
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="CAR">Standard Passenger Car</option>
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="ELECTRIC">100% Electric Vehicle</option>
                  <option value="AMBULANCE">Ambulance</option>
                  <option value="TRUCK">Prime Mover / Trailer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                <select 
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Make</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <select 
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={!selectedMake}
                  className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50"
                >
                  <option value="">Select Model</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year of Manufacture</label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  disabled={!selectedModel}
                  className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                  {!years.length && <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Engine CC</label>
                  <input 
                    type="number"
                    value={engineSize}
                    onChange={(e) => setEngineSize(Number(e.target.value))}
                    className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                  <select 
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CIF Value (Optional - USD)
                  <span className="ml-1 text-gray-400 cursor-help" title="Cost, Insurance, and Freight. If left blank, we use KRA CRSP values.">
                    <Info className="w-3 h-3 inline" />
                  </span>
                </label>
                <input 
                  type="number"
                  value={cifValue}
                  onChange={(e) => setCifValue(Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="w-full rounded-lg border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <button
                onClick={handleCalculate}
                disabled={loading || !selectedYear}
                className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center disabled:bg-gray-400"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Calculator className="w-5 h-5 mr-2" />
                    Calculate Taxes
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start">
            <ShieldCheck className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>KRA Compliance:</strong> This calculator uses the latest CRSP (Current Retail Selling Price) data and depreciation schedules as per KRA guidelines.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
            <h3 className="text-xl font-bold mb-2">Need help importing?</h3>
            <p className="text-blue-100 text-sm mb-4">Our concierge service handles sourcing, shipping, and KRA clearance for you.</p>
            <button 
              onClick={() => {
                if (!user && setView) {
                  setView('LOGIN');
                  return;
                }
                setIsImportServiceOpen(true);
              }}
              className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center justify-center"
            >
              Request Import Service
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center">
              <AlertTriangle className="w-5 h-5 mr-3" />
              {error}
            </div>
          )}

          {!result && !error && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Calculator className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Ready to Calculate</h3>
              <p className="text-gray-500 max-w-sm">
                Enter your vehicle details on the left to see a full breakdown of import duties, taxes, and total costs.
              </p>
            </div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-orange-600 p-6 text-white">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-orange-100 text-sm uppercase tracking-wider font-semibold mb-1">Total Estimated Cost</p>
                      <h2 className="text-4xl font-bold">{formatCurrency(result.totalCost)}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-100 text-sm mb-1">Total Taxes</p>
                      <p className="text-2xl font-semibold">{formatCurrency(result.totalTaxes)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Tax Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">Import Duty (25%)</span>
                      <span className="font-medium">{formatCurrency(result.importDuty)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">
                        Excise Duty 
                        ({result.breakdown.fixedExcise > 0 
                          ? 'Fixed' 
                          : `${Math.round(result.breakdown.exciseDutyRate * 100)}%`})
                      </span>
                      <span className="font-medium">{formatCurrency(result.exciseDuty)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">VAT (16%)</span>
                      <span className="font-medium">{formatCurrency(result.vat)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">IDF (3.5%)</span>
                      <span className="font-medium">{formatCurrency(result.idf)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-600">RDL (2%)</span>
                      <span className="font-medium">{formatCurrency(result.rdl)}</span>
                    </div>
                    <div className="flex justify-between py-3 bg-gray-50 px-4 rounded-lg mt-4">
                      <span className="font-semibold text-gray-900">Total Taxes & Levies</span>
                      <span className="font-bold text-orange-600">{formatCurrency(result.totalTaxes)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monetization Layer: Recommended Parts */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Essential Parts for your {selectedMake}</h3>
                    <p className="text-sm text-gray-500">Ensure your import is road-ready with genuine Masuma parts.</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedParts.length > 0 ? (
                    recommendedParts.map(product => (
                      <div key={product.id} className="flex items-center p-3 border border-gray-100 rounded-xl hover:border-orange-200 transition-colors group">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg mr-4"
                        />
                        <div className="flex-grow">
                          <h4 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">{product.name}</h4>
                          <p className="text-sm text-gray-500">{product.category}</p>
                          <p className="text-orange-600 font-bold">{formatCurrency(product.price)}</p>
                        </div>
                        <button className="p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-orange-600 hover:text-white transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-gray-400 italic">
                      Loading recommended maintenance parts...
                    </div>
                  )}
                </div>
                
                <button className="w-full mt-6 py-3 border-2 border-orange-600 text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-colors">
                  View Full Maintenance Kit for {selectedMake} {selectedModel}
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                <button className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-black transition-colors flex items-center justify-center">
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF Report
                </button>
                <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Results
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isImportServiceOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="my-8 w-full max-w-4xl">
              <ImportServiceForm 
                onCancel={() => setIsImportServiceOpen(false)}
                onSuccess={() => setIsImportServiceOpen(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImportCalculator;
