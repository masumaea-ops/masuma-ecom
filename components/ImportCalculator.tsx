import React, { useState, useEffect } from 'react';
import { 
  Calculator, Info, AlertTriangle, CheckCircle2, 
  ChevronRight, Download, Share2, Car, Search,
  ArrowRight, ShieldCheck, TrendingUp, Settings,
  Ship, Settings2
} from 'lucide-react';
import { apiClient } from '../utils/apiClient';
import { CrspData, ImportCalculationResult, Product } from '../types';
import { formatPrice } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from './SEO';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ImportServiceForm from './ImportServiceForm';
import ImportTracking from './ImportTracking';

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

  // Kenya 8-year rule: Current year down to 8 years ago (total 9 years)
  const currentYear = new Date().getFullYear();
  const allowedYears = Array.from({ length: 9 }, (_, i) => currentYear - i);
  
  const [crspList, setCrspList] = useState<CrspData[]>([]);
  const [selectedCrsp, setSelectedCrsp] = useState<CrspData | null>(null);
  const [crspVariants, setCrspVariants] = useState<CrspData[]>([]);
  const [customCrsp, setCustomCrsp] = useState<number>(0);
  
  const [engineSize, setEngineSize] = useState<number>(1500);
  const [fuelType, setFuelType] = useState('Petrol');
  const [cifValue, setCifValue] = useState<number>(0);
  
  const [result, setResult] = useState<ImportCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [recommendedParts, setRecommendedParts] = useState<Product[]>([]);
  const [isImportServiceOpen, setIsImportServiceOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'TRACKING'>('CALCULATOR');

  useEffect(() => {
    fetchCrspData();
  }, []);

  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const fetchCrspData = async () => {
    try {
      const res = await apiClient.get('/import-calculator/crsp/makes');
      setMakes(res.data);
    } catch (e) {
      console.error('Error fetching CRSP makes', e);
    }
  };

  useEffect(() => {
    if (selectedMake) {
      const fetchModels = async () => {
        try {
          const res = await apiClient.get(`/import-calculator/crsp/models?make=${selectedMake}`);
          setModels(res.data);
          setSelectedModel('');
        } catch (e) {
          console.error('Error fetching CRSP models', e);
        }
      };
      fetchModels();
    }
  }, [selectedMake]);

  useEffect(() => {
    if (selectedMake && selectedModel) {
      const fetchYears = async () => {
        try {
          const res = await apiClient.get(`/import-calculator/crsp/years?make=${selectedMake}&model=${selectedModel}`);
          // Filter years to stick to 8-year rule
          const validYears = res.data.filter((y: number) => y >= currentYear - 8);
          setYears(validYears);
          
          // If the currently selected year is not in the new list, 
          // but is within the 8-year rule, we keep it. 
          // Otherwise, we pick the newest available.
          if (validYears.length > 0 && !validYears.includes(selectedYear)) {
            if (selectedYear < currentYear - 8 || selectedYear > currentYear) {
              setSelectedYear(validYears[0]);
            }
          }
        } catch (e) {
          console.error('Error fetching CRSP years', e);
        }
      };
      fetchYears();
    }
  }, [selectedMake, selectedModel]);

  useEffect(() => {
    if (selectedMake && selectedModel && selectedYear) {
      const fetchCrspVariants = async () => {
        try {
          const res = await apiClient.get(`/import-calculator/crsp?make=${selectedMake}&model=${selectedModel}&year=${selectedYear}&limit=50`);
          const variants = res.data.results || [];
          setCrspVariants(variants);
          
          if (variants.length > 0) {
            // Default to the first one if only one, or if none selected yet
            const first = variants[0];
            setSelectedCrsp(first);
            if (first.engineSize) setEngineSize(Number(first.engineSize));
            if (first.fuelType) setFuelType(first.fuelType);
            setCustomCrsp(0);
          } else {
            setSelectedCrsp(null);
          }
        } catch (e) {
          console.error('Error fetching CRSP variants', e);
          setCrspVariants([]);
          setSelectedCrsp(null);
        }
      };
      fetchCrspVariants();
    } else {
      setCrspVariants([]);
      setSelectedCrsp(null);
    }
  }, [selectedMake, selectedModel, selectedYear]);

  const handleVariantChange = (crspId: string) => {
    const variant = crspVariants.find(v => v.id === crspId);
    if (variant) {
      setSelectedCrsp(variant);
      if (variant.engineSize) setEngineSize(Number(variant.engineSize));
      if (variant.fuelType) setFuelType(variant.fuelType);
      setCustomCrsp(0);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/import-calculator/calculate', {
        crspId: selectedCrsp?.id,
        customCrsp: customCrsp > 0 ? customCrsp : undefined,
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
    setLoadingRecommendations(true);
    try {
      // Fetch parts compatible with the selected make/model
      const res = await apiClient.get(`/products?search=${selectedMake} ${selectedModel}`);
      setRecommendedParts(res.data.slice(0, 4));
    } catch (e) {
      console.error('Error fetching recommendations', e);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const generatePDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(255, 102, 0); // Masuma Orange
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MASUMA IMPORT REPORT', 20, 25);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 150, 25);

    // Vehicle Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Vehicle Information', 20, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [['Field', 'Value']],
      body: [
        ['Make', selectedMake],
        ['Model', selectedModel],
        ['Year', selectedYear.toString()],
        ['Engine Size', `${engineSize} CC`],
        ['Fuel Type', fuelType],
        ['Vehicle Type', vehicleType]
      ],
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40] }
    });

    // Cost Breakdown
    doc.setFontSize(14);
    doc.text('Import Cost Breakdown', 20, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Description', 'Amount (KES)']],
      body: [
        ['Customs Value (CIF)', formatCurrency(result.cif)],
        ['Import Duty', formatCurrency(result.importDuty)],
        ['Excise Duty', formatCurrency(result.exciseDuty)],
        ['VAT (16%)', formatCurrency(result.vat)],
        ['IDF', formatCurrency(result.idf)],
        ['RDL', formatCurrency(result.rdl)],
        ['Total Taxes', formatCurrency(result.totalTaxes)],
        ['TOTAL ESTIMATED COST', formatCurrency(result.totalCost)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [255, 102, 0] },
      foot: [['TOTAL', formatCurrency(result.totalCost)]],
      footStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('This is an automated estimate based on current KRA CRSP values and tax rates.', 20, finalY + 20);
    doc.text('Final costs may vary based on actual customs assessment.', 20, finalY + 26);
    
    doc.save(`Masuma_Import_Report_${selectedMake}_${selectedModel}.pdf`);
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
      <SEO 
        title={result ? `Import Tax for ${selectedMake} ${selectedModel} | Masuma Kenya` : "KRA Import Cost Calculator | Vehicle Duties Kenya"}
        description={result ? `Calculated import duty for ${selectedMake} ${selectedModel} (${selectedYear}). Total estimated cost: ${formatCurrency(result.totalCost)}.` : "Calculate accurate vehicle import duties and taxes for Kenya using real CRSP data. Intelligent KRA tax engine."}
        keywords="import duty calculator Kenya, KRA car taxes, vehicle import cost Nairobi"
      />
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tight">Vehicle Import Concierge</h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 font-bold">
          From calculation to collection. We handle the entire KRA import process for you.
        </p>
        
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
            <button 
              onClick={() => setActiveTab('CALCULATOR')}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'CALCULATOR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Cost Calculator
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('TRACKING')}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'TRACKING' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Track My Imports
              </div>
            </button>
          </div>
        </div>

        {user?.role === 'ADMIN' && (
          <button 
            onClick={() => setView?.('DASHBOARD')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-masuma-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10"
          >
            <Settings className="w-4 h-4" />
            Manage CRSP Data (Admin)
          </button>
        )}
      </div>

      {activeTab === 'CALCULATOR' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center">
                <Car className="w-5 h-5 mr-3 text-masuma-orange" />
                Vehicle Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Vehicle Category</label>
                  <select 
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  >
                    <option value="CAR">Standard Passenger Car</option>
                    <option value="MOTORCYCLE">Motorcycle</option>
                    <option value="ELECTRIC">100% Electric Vehicle</option>
                    <option value="AMBULANCE">Ambulance</option>
                    <option value="TRUCK">Prime Mover / Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Make</label>
                  <select 
                    value={selectedMake}
                    onChange={(e) => setSelectedMake(e.target.value)}
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  >
                    <option value="">Select Make</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Model</label>
                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedMake}
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all disabled:opacity-50"
                  >
                    <option value="">Select Model</option>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Year of Manufacture
                    <span className="ml-2 text-masuma-orange font-black">(Kenya 8-Year Rule)</span>
                  </label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    disabled={!selectedModel}
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all disabled:opacity-50"
                  >
                    {allowedYears.map(y => (
                      <option key={y} value={y}>
                        {y} {years.includes(y) ? '' : '(Manual Entry)'}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[10px] text-gray-400 font-bold italic">
                    * Vehicles older than {currentYear - 8} cannot be imported.
                  </p>
                </div>

                {/* Depreciation Schedule Info */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1.5 text-masuma-orange" />
                    Depreciation Schedule
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
                    <div className="flex justify-between text-gray-500 font-bold">
                      <span>&gt;1 ≤2 years</span>
                      <span className="text-masuma-orange">20%</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-bold">
                      <span>&gt;2 ≤3 years</span>
                      <span className="text-masuma-orange">30%</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-bold">
                      <span>&gt;3 ≤4 years</span>
                      <span className="text-masuma-orange">40%</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-bold">
                      <span>&gt;4 ≤5 years</span>
                      <span className="text-masuma-orange">50%</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-bold">
                      <span>&gt;5 ≤6 years</span>
                      <span className="text-masuma-orange">55%</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-bold">
                      <span>&gt;6 ≤7 years</span>
                      <span className="text-masuma-orange">60%</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-bold col-span-2 border-t border-gray-200 pt-1.5 mt-1">
                      <span>&gt;7 ≤8 years</span>
                      <span className="text-masuma-orange">65%</span>
                    </div>
                  </div>
                </div>

                {!selectedCrsp && selectedModel && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-masuma-orange/5 border border-masuma-orange/20 rounded-2xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-masuma-orange shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-masuma-orange uppercase tracking-widest mb-1">CRSP Not Found</p>
                        <p className="text-[10px] text-gray-500 font-bold leading-relaxed mb-3">
                          We don't have the KRA CRSP value for {selectedYear} in our database. Please enter it manually or provide a CIF value.
                        </p>
                        <div className="space-y-2">
                          <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Manual CRSP (KES)</label>
                          <input 
                            type="number"
                            value={customCrsp}
                            onChange={(e) => setCustomCrsp(Number(e.target.value))}
                            placeholder="e.g. 2500000"
                            className="w-full rounded-xl border-masuma-orange/20 bg-white p-3 text-xs font-bold focus:ring-1 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* CRSP Variant Selection */}
                {crspVariants.length > 1 && (
                  <div className="bg-masuma-orange/5 border border-masuma-orange/20 rounded-2xl p-4 mb-4">
                    <label className="block text-[10px] font-black text-masuma-orange uppercase tracking-widest mb-2 flex items-center">
                      <Settings2 className="w-3 h-3 mr-1.5" />
                      Select Specific Variant (Engine/Fuel)
                    </label>
                    <select 
                      value={selectedCrsp?.id || ''}
                      onChange={(e) => handleVariantChange(e.target.value)}
                      className="w-full rounded-xl border-masuma-orange/20 bg-white p-3 text-xs font-bold focus:ring-1 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                    >
                      {crspVariants.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.engineSize}cc {v.fuelType} {v.transmission ? `- ${v.transmission}` : ''} (KES {formatPrice(v.crspValue)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Engine CC</label>
                    <input 
                      type="number"
                      value={engineSize}
                      onChange={(e) => setEngineSize(Number(e.target.value))}
                      className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fuel Type</label>
                    <select 
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
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
                    className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-bold focus:ring-2 focus:ring-masuma-orange focus:border-masuma-orange transition-all"
                  />
                </div>

                <button
                  onClick={handleCalculate}
                  disabled={loading || !selectedYear}
                  className="w-full bg-masuma-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-masuma-orange-dark transition-all flex items-center justify-center disabled:bg-gray-200 shadow-lg shadow-masuma-orange/20"
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

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start">
              <ShieldCheck className="w-6 h-6 text-blue-600 mr-4 mt-0.5" />
              <p className="text-sm text-blue-900 font-bold leading-relaxed">
                <strong className="block mb-1">KRA Compliance:</strong> This calculator uses the latest CRSP data and depreciation schedules as per KRA guidelines.
              </p>
            </div>

            <div className="bg-masuma-dark rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-masuma-orange rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight relative z-10">Need help importing?</h3>
              <p className="text-gray-400 text-sm mb-8 font-bold leading-relaxed relative z-10">Our concierge service handles sourcing, shipping, and KRA clearance for you.</p>
              <button 
                onClick={() => {
                  if (!user && setView) {
                    setView('LOGIN');
                    return;
                  }
                  setIsImportServiceOpen(true);
                }}
                className="w-full bg-masuma-orange text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white hover:text-masuma-dark transition-all flex items-center justify-center relative z-10 shadow-lg shadow-masuma-orange/20"
              >
                Request Import Service
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-6 rounded-2xl flex items-center font-bold">
                <AlertTriangle className="w-6 h-6 mr-4" />
                {error}
              </div>
            )}

            {!result && !error && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
                  <Calculator className="w-16 h-16 text-gray-200" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Ready to Calculate</h3>
                <p className="text-gray-500 max-w-sm font-bold leading-relaxed">
                  Enter your vehicle details on the left to see a full breakdown of import duties, taxes, and total costs.
                </p>
              </div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Summary Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-masuma-orange p-8 text-white">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/60 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Total Estimated Cost</p>
                        <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(result.totalCost)}</h2>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Total Taxes</p>
                        <p className="text-3xl font-black tracking-tight">{formatCurrency(result.totalTaxes)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6">Tax Breakdown</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b border-gray-50">
                        <span className="text-gray-500 font-bold">KRA CRSP Value</span>
                        <span className="font-black text-gray-900">{formatCurrency(result.cif / (1 - result.breakdown.depreciationRate))}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-gray-50 bg-masuma-orange/5 -mx-4 px-4 rounded-lg">
                        <span className="text-masuma-orange font-black flex items-center">
                          Depreciation Applied ({Math.round(result.breakdown.depreciationRate * 100)}%)
                          <span title="Based on Kenya's 8-year import rule depreciation schedule.">
                            <Info className="w-3 h-3 ml-1.5 cursor-help" />
                          </span>
                        </span>
                        <span className="font-black text-masuma-orange">-{formatCurrency((result.cif / (1 - result.breakdown.depreciationRate)) * result.breakdown.depreciationRate)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-gray-50">
                        <span className="text-gray-500 font-bold">Customs Value (CIF)</span>
                        <span className="font-black text-gray-900">{formatCurrency(result.cif)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-gray-50">
                        <span className="text-gray-500 font-bold">Import Duty ({result.breakdown.importDutyRate * 100}%)</span>
                        <span className="font-black text-gray-900">{formatCurrency(result.importDuty)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-gray-50">
                        <span className="text-gray-500 font-bold">
                          Excise Duty 
                          ({result.breakdown.fixedExcise > 0 
                            ? 'Fixed' 
                            : `${Math.round(result.breakdown.exciseDutyRate * 100)}%`})
                        </span>
                        <span className="font-black text-gray-900">{formatCurrency(result.exciseDuty)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-gray-50">
                        <span className="text-gray-500 font-bold">VAT ({result.breakdown.vatRate * 100}%)</span>
                        <span className="font-black text-gray-900">{formatCurrency(result.vat)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-gray-50">
                        <span className="text-gray-500 font-bold">IDF (2.5%)</span>
                        <span className="font-black text-gray-900">{formatCurrency(result.idf)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-gray-50">
                        <span className="text-gray-500 font-bold">RDL (2%)</span>
                        <span className="font-black text-gray-900">{formatCurrency(result.rdl)}</span>
                      </div>
                      <div className="flex justify-between py-5 bg-gray-50 px-6 rounded-2xl mt-6">
                        <span className="font-black text-gray-900 uppercase tracking-widest text-xs">Total Taxes & Levies</span>
                        <span className="font-black text-masuma-orange text-xl">{formatCurrency(result.totalTaxes)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Parts */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Essential Parts</h3>
                      <p className="text-sm text-gray-500 font-bold">Ensure your import is road-ready with genuine Masuma parts.</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-masuma-orange" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loadingRecommendations ? (
                      <div className="col-span-2 text-center py-12 text-gray-400 font-bold italic">
                        <div className="w-8 h-8 border-4 border-masuma-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        Finding compatible Masuma parts...
                      </div>
                    ) : recommendedParts.length > 0 ? (
                      recommendedParts.map(product => (
                        <div key={product.id} className="flex items-center p-4 border border-gray-100 rounded-2xl hover:border-masuma-orange transition-all group bg-gray-50/30">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-xl mr-5 shadow-sm"
                          />
                          <div className="flex-grow">
                            <h4 className="font-black text-gray-900 group-hover:text-masuma-orange transition-colors uppercase text-xs tracking-tight">{product.name}</h4>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{product.category}</p>
                            <p className="text-masuma-orange font-black mt-2">{formatCurrency(product.price)}</p>
                          </div>
                          <button className="p-3 bg-white text-gray-400 rounded-xl hover:bg-masuma-orange hover:text-white transition-all shadow-sm">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 text-gray-400 font-bold italic">
                        No specific recommendations found for this model.
                      </div>
                    )}
                  </div>
                  
                  <button className="w-full mt-8 py-4 border-2 border-masuma-orange text-masuma-orange rounded-2xl font-black uppercase tracking-widest hover:bg-masuma-orange hover:text-white transition-all">
                    View Full Maintenance Kit for {selectedMake}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={generatePDF}
                    className="flex-1 bg-masuma-dark text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center shadow-xl shadow-black/10"
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Download PDF Report
                  </button>
                  <button className="flex-1 bg-white border-2 border-gray-100 text-gray-900 py-4 rounded-2xl font-black uppercase tracking-widest hover:border-masuma-orange transition-all flex items-center justify-center">
                    <Share2 className="w-5 h-5 mr-3" />
                    Share Results
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <ImportTracking />
        </div>
      )}

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
