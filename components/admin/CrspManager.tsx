import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, 
  Loader2, Download, Trash2, Search, Filter, Database,
  Edit2, X, Save, ChevronLeft, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiClient } from '../../utils/apiClient';

const CrspManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [defaultYear, setDefaultYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manage State
  const [existingData, setExistingData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [fetching, setFetching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchExistingData();
    }
  }, [activeTab, page, search]);

  const fetchExistingData = async () => {
    setFetching(true);
    try {
      const response = await apiClient.get('/import-calculator/crsp', {
        params: { page, limit: 15, search }
      });
      setExistingData(response.data.results);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Failed to fetch CRSP data', err);
    } finally {
      setFetching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target?.result;
        const wb = XLSX.read(ab, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        
        if (jsonData.length > 0) {
          // Map headers and clean data
          const mappedData = jsonData.map((row: any) => {
            const cleanRow: any = {
              make: row.Make || row.make,
              model: row.Model || row.model,
              year: row.Year || row.year || defaultYear,
              transmission: row.Transmission || row.transmission,
              fuelType: row.Fuel || row.fuel || row.fuelType,
              category: row['Body Type'] || row.category,
            };

            // Parse CRSP Value (remove commas, currency symbols)
            let rawCrsp = row['CRSP (KES.)'] || row.crspValue || row.crsp;
            if (typeof rawCrsp === 'string') {
              rawCrsp = parseFloat(rawCrsp.replace(/[^0-9.]/g, ''));
            }
            cleanRow.crspValue = rawCrsp;

            // Parse Engine Size (handle "63 kWh", "3000", etc.)
            let rawEngine = row['Engine Capacity'] || row.engineSize;
            if (typeof rawEngine === 'string') {
              // Extract first numeric part
              const match = rawEngine.match(/[0-9.]+/);
              rawEngine = match ? parseFloat(match[0]) : 0;
            }
            cleanRow.engineSize = rawEngine;

            return cleanRow;
          });

          // Basic validation
          const invalid = mappedData.filter(d => !d.make || !d.model || isNaN(d.crspValue));
          if (invalid.length > 0 && mappedData.length === invalid.length) {
            setError('Could not find required columns (Make, Model, CRSP). Please check your Excel headers.');
            setUploadData([]);
          } else {
            setUploadData(mappedData.filter(d => d.make && d.model && !isNaN(d.crspValue)));
          }
        } else {
          setError('The Excel file appears to be empty.');
        }
      } catch (err) {
        setError('Failed to parse Excel file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (uploadData.length === 0) return;
    setUploading(true);
    try {
      await apiClient.post('/import-calculator/upload-crsp', uploadData);
      setSuccess(`Successfully uploaded ${uploadData.length} records.`);
      setUploadData([]);
      setFile(null);
      if (activeTab === 'manage') fetchExistingData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload CRSP data.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await apiClient.delete(`/import-calculator/crsp/${id}`);
      fetchExistingData();
    } catch (err) {
      alert('Failed to delete record');
    }
  };

  const startEdit = (record: any) => {
    setEditingId(record.id);
    setEditForm({ ...record });
  };

  const saveEdit = async () => {
    try {
      await apiClient.put(`/import-calculator/crsp/${editingId}`, editForm);
      setEditingId(null);
      fetchExistingData();
    } catch (err) {
      alert('Failed to save changes');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRSP Data Management</h1>
          <p className="text-gray-500">Manage KRA Current Retail Selling Price (CRSP) data.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'upload' ? 'bg-masuma-orange text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Upload Excel
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'manage' ? 'bg-masuma-orange text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Manage Existing
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Upload size={20} className="text-masuma-orange" />
                Upload New Data
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Year for this CRSP List</label>
                  <input 
                    type="number" 
                    value={defaultYear}
                    onChange={(e) => setDefaultYear(parseInt(e.target.value))}
                    className="w-full rounded-xl border-gray-200 focus:ring-masuma-orange focus:border-masuma-orange text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Used if the Excel file doesn't have a 'Year' column.</p>
                </div>

                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-masuma-orange'}`}>
                  <input type="file" id="crsp-upload" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                  <label htmlFor="crsp-upload" className="cursor-pointer block">
                    <FileSpreadsheet className={`w-12 h-12 mx-auto mb-3 ${file ? 'text-green-500' : 'text-gray-300'}`} />
                    <p className="text-sm font-bold text-gray-900 mb-1">{file ? file.name : 'Click to select Excel file'}</p>
                    <p className="text-xs text-gray-500">Supports .xlsx and .xls</p>
                  </label>
                </div>
                {loading && <div className="flex items-center justify-center py-4 text-sm text-gray-500"><Loader2 className="animate-spin mr-2" size={16} />Parsing...</div>}
                {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"><AlertTriangle className="text-red-600 shrink-0" size={18} /><p className="text-xs text-red-700">{error}</p></div>}
                {success && <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3"><CheckCircle2 className="text-green-600 shrink-0" size={18} /><p className="text-xs text-green-700">{success}</p></div>}
                {uploadData.length > 0 && !loading && (
                  <div className="space-y-4">
                    <button onClick={handleUpload} disabled={uploading} className="w-full bg-masuma-dark text-white py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center disabled:bg-gray-400">
                      {uploading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Database className="mr-2" size={18} />}
                      {uploading ? 'Processing...' : 'Commit to Database'}
                    </button>
                    <button onClick={() => { setFile(null); setUploadData([]); }} className="w-full py-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">Discard</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Data Preview</h2>
                <span className="text-xs font-bold text-gray-400 uppercase">{uploadData.length} Records</span>
              </div>
              <div className="flex-grow overflow-auto">
                {uploadData.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Make</th>
                        <th className="px-6 py-3">Model</th>
                        <th className="px-6 py-3">Year</th>
                        <th className="px-6 py-3">Engine</th>
                        <th className="px-6 py-3">Fuel</th>
                        <th className="px-6 py-3 text-right">CRSP (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {uploadData.slice(0, 50).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-bold text-gray-900">{row.make}</td>
                          <td className="px-6 py-3 text-gray-600">{row.model}</td>
                          <td className="px-6 py-3 text-gray-600">{row.year}</td>
                          <td className="px-6 py-3 text-gray-500">{row.engineSize || '-'}</td>
                          <td className="px-6 py-3 text-gray-500">{row.fuelType || '-'}</td>
                          <td className="px-6 py-3 text-right font-bold text-masuma-orange">{row.crspValue?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400">
                    <FileSpreadsheet size={48} className="mb-4 opacity-20" />
                    <p className="text-sm">Upload an Excel file to see a preview.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search make or model..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border-gray-200 focus:ring-masuma-orange focus:border-masuma-orange"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Total: <b>{total}</b> records</span>
              <div className="flex items-center gap-1 ml-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronLeft size={18} /></button>
                <span className="px-2">Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronRight size={18} /></button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Make</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Year</th>
                  <th className="px-6 py-3 text-right">CRSP (KES)</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {fetching ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400"><Loader2 className="animate-spin mx-auto mb-2" />Loading records...</td></tr>
                ) : existingData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    {editingId === record.id ? (
                      <>
                        <td className="px-6 py-2"><input type="text" value={editForm.make} onChange={e => setEditForm({...editForm, make: e.target.value})} className="w-full p-1 border rounded" /></td>
                        <td className="px-6 py-2"><input type="text" value={editForm.model} onChange={e => setEditForm({...editForm, model: e.target.value})} className="w-full p-1 border rounded" /></td>
                        <td className="px-6 py-2"><input type="number" value={editForm.year} onChange={e => setEditForm({...editForm, year: parseInt(e.target.value)})} className="w-full p-1 border rounded" /></td>
                        <td className="px-6 py-2"><input type="number" value={editForm.crspValue} onChange={e => setEditForm({...editForm, crspValue: parseFloat(e.target.value)})} className="w-full p-1 border rounded text-right" /></td>
                        <td className="px-6 py-2 text-right flex justify-end gap-2">
                          <button onClick={saveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Save size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><X size={18} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-bold text-gray-900">{record.make}</td>
                        <td className="px-6 py-4 text-gray-600">{record.model}</td>
                        <td className="px-6 py-4 text-gray-600">{record.year}</td>
                        <td className="px-6 py-4 text-right font-bold text-masuma-orange">{record.crspValue?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button onClick={() => startEdit(record)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(record.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrspManager;
