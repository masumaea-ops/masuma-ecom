import { Search, Plus, Edit2, Trash2, X, Save, Loader2, UploadCloud, Download, Upload, Package, ChevronLeft, ChevronRight, Percent, AlertTriangle, FileSpreadsheet, CheckCircle, Info, ArrowRight, RotateCcw, ShieldAlert, ChevronDown, Image as ImageIcon, Video, Link, Star, Check } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Product, Branch } from '../../types';
import { apiClient } from '../../utils/apiClient';

const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isNuclearOpen, setIsNuclearOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [oemString, setOemString] = useState(''); 
  const [compatString, setCompatString] = useState(''); 
  const [discountPercentage, setDiscountPercentage] = useState<string>('0');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Bulk Import Wizard State
  const [importStep, setImportStep] = useState<'upload' | 'validate' | 'success'>('upload');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importTargetBranch, setImportTargetBranch] = useState('');
  const [dryRunReport, setDryRunReport] = useState<any>(null);
  const [importStatus, setImportStatus] = useState<{success?: string, error?: string, batchId?: string} | null>(null);

  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    try {
        const res = await apiClient.get(`/products?q=${searchTerm}&page=${page}&limit=${pagination.limit}`);
        if (res.data && res.data.data) {
            setProducts(res.data.data);
            setPagination(res.data.meta);
        } else {
            setProducts(res.data);
        }
        setSelectedIds([]); 
    } catch (error) {
        console.error('Failed to fetch products', error);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchData = async () => {
      try {
          const [catRes, branchRes] = await Promise.all([
              apiClient.get('/categories'),
              apiClient.get('/branches')
          ]);
          setCategories(catRes.data);
          setBranches(branchRes.data);
          if (branchRes.data.length > 0) setImportTargetBranch(branchRes.data[0].id);
      } catch (error) {
          console.error('Failed to fetch support data', error);
      }
  };

  useEffect(() => {
    const debounce = setTimeout(() => fetchProducts(1), 500);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  useEffect(() => {
      fetchData();
  }, []);

  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= pagination.pages) {
          fetchProducts(newPage);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      
      try {
          const uploadedUrls: string[] = [];
          for (let i = 0; i < files.length; i++) {
              const uploadData = new FormData();
              uploadData.append('image', files[i]);
              const res = await apiClient.post('/upload', uploadData);
              if (res.data && res.data.url) {
                  uploadedUrls.push(res.data.url);
              }
          }

          setFormData((prev: any) => {
              const currentImages = prev.images || [];
              const newImages = [...currentImages, ...uploadedUrls];
              // If no main image is set, pick the first one uploaded
              const newImageUrl = prev.imageUrl || uploadedUrls[0];
              return { 
                  ...prev, 
                  images: newImages,
                  imageUrl: newImageUrl
              };
          });
      } catch (error: any) {
          alert('Upload failed: ' + (error.response?.data?.error || 'Server error'));
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const removeImage = (urlToRemove: string) => {
      setFormData((prev: any) => {
          const newImages = (prev.images || []).filter((url: string) => url !== urlToRemove);
          let newMainUrl = prev.imageUrl;
          
          // If we deleted the main image, pick a new one from the remaining gallery
          if (newMainUrl === urlToRemove) {
              newMainUrl = newImages.length > 0 ? newImages[0] : '';
          }
          
          return { ...prev, images: newImages, imageUrl: newMainUrl };
      });
  };

  const setAsMain = (url: string) => {
      setFormData((prev: any) => ({ ...prev, imageUrl: url }));
  };

  const handleGlobalAdjustment = async () => {
      const percentage = parseFloat(discountPercentage);
      if (isNaN(percentage)) return alert('Invalid percentage');
      if (!confirm(`Apply a ${percentage}% adjustment to ALL products in the database? This cannot be easily undone.`)) return;
      
      setIsAdjusting(true);
      try {
          await apiClient.post('/products/adjust-prices', { percentage });
          setIsDiscountModalOpen(false);
          fetchProducts(1);
          alert(`Success! All catalog prices adjusted by ${percentage}%.`);
      } catch (e) {
          alert('Price adjustment failed.');
      } finally {
          setIsAdjusting(false);
      }
  };

  const handleBulkDelete = async () => {
      if (!selectedIds.length) return;
      if (!confirm(`Are you sure you want to permanently delete these ${selectedIds.length} products? This will also remove their stock levels and OEM references.`)) return;
      
      setIsBulkDeleting(true);
      try {
          await apiClient.post('/products/bulk/delete', { ids: selectedIds });
          alert(`Successfully deleted ${selectedIds.length} products.`);
          fetchProducts(pagination.page);
      } catch (error: any) {
          alert(error.response?.data?.error || 'Bulk delete failed.');
      } finally {
          setIsBulkDeleting(false);
      }
  };

  const parseCSV = (text: string) => {
      const lines = text.split(/\r?\n/);
      if (lines.length === 0) return [];
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
      const results: any[] = [];
      for (let i = 1; i < lines.length; i++) {
          const row = lines[i].trim();
          if (!row) continue;
          const values: string[] = [];
          let currentField = '';
          let inQuotes = false;
          for (let charIndex = 0; charIndex < row.length; charIndex++) {
              const char = row[charIndex];
              const nextChar = row[charIndex + 1];
              if (char === '"') {
                  if (inQuotes && nextChar === '"') { currentField += '"'; charIndex++; } else { inQuotes = !inQuotes; }
              } else if (char === ',' && !inQuotes) { values.push(currentField.trim()); currentField = ''; } else { currentField += char; }
          }
          values.push(currentField.trim()); 
          const obj: any = {};
          headers.forEach((header, index) => {
              let val = values[index] !== undefined ? values[index].replace(/^"|"$/g, '').trim() : '';
              if (header === 'sku') obj['sku'] = val;
              else if (header === 'name') obj['name'] = val;
              else if (header === 'category') obj['category'] = val;
              else if (header === 'price (retail)' || header === 'price') obj['price'] = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
              else if (header === 'quantity') obj['quantity'] = parseInt(val.replace(/[^0-9]/g, '')) || 0;
              else if (header === 'cost price') obj['costPrice'] = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
              else if (header === 'description') obj['description'] = val;
              else if (header === 'oem numbers') obj['oemNumbers'] = val;
              else if (header === 'image url') obj['imageUrl'] = val;
              else if (header === 'video url') obj['videoUrl'] = val;
          });
          results.push(obj);
      }
      return results;
  };

  const handleBulkSubmit = async (isDryRun: boolean = true) => {
      if (!bulkFile || !importTargetBranch) return;
      setIsImporting(true);
      setImportStatus(null);
      const reader = new FileReader();
      reader.onload = async (e) => {
          const text = e.target?.result as string;
          const products = parseCSV(text);
          if (products.length === 0) {
              setImportStatus({ error: "CSV file is empty." });
              setIsImporting(false);
              return;
          }
          try {
              const res = await apiClient.post('/products/bulk', { branchId: importTargetBranch, products, dryRun: isDryRun });
              if (isDryRun) {
                  setDryRunReport(res.data);
                  setImportStep('validate');
              } else {
                  setImportStatus({ 
                    success: `Import Finalized! ${res.data.created} created, ${res.data.updated} updated.`,
                    batchId: res.data.batchId
                  });
                  setImportStep('success');
                  fetchProducts(1);
              }
          } catch (err: any) {
              setImportStatus({ error: err.response?.data?.error || "Import failed." });
          } finally {
              setIsImporting(false);
          }
      };
      reader.readAsText(bulkFile);
  };

  const handleRollback = async (batchId: string) => {
      if (!confirm(`UNDO ACTION: This will delete all products created in session ${batchId}. This is used to fix incorrect mapping. Continue?`)) return;
      setIsImporting(true);
      try {
          await apiClient.delete(`/products/bulk/rollback/${batchId}`);
          alert('Rollback successful. Corrupted items removed.');
          setIsBulkModalOpen(false);
          fetchProducts(1);
      } catch (e) {
          alert('Rollback failed.');
      } finally {
          setIsImporting(false);
      }
  };

  const handleClearAll = async () => {
      if (!confirm('EXTREME DANGER: This will delete ALL products, stock records, and OEMs in the database. Use this to start fresh after a bad import. Type "CONFIRM" in the next prompt.')) return;
      if (prompt('Type "CONFIRM" to proceed with a full catalog wipe:') !== 'CONFIRM') return;
      
      setIsLoading(true);
      try {
          await apiClient.post('/products/bulk/clear-all');
          alert('Database cleared. You can now perform a clean import.');
          fetchProducts(1);
      } catch (e) {
          alert('Reset failed.');
      } finally {
          setIsLoading(false);
      }
  };

  const handleAddNew = () => {
    setFormData({ name: '', sku: '', price: '', costPrice: '', wholesalePrice: '', quantity: '', description: '', category: categories[0]?.name || 'General', imageUrl: '', images: [], videoUrl: '', oemNumbers: [], compatibility: [] });
    setOemString(''); setCompatString(''); setIsEditorOpen(true);
  };

  const handleEdit = (product: Product) => {
    const gallery = (product as any).images || [];
    // Ensure the main image is included in the gallery if missing
    if (product.image && !gallery.includes(product.image)) {
        gallery.unshift(product.image);
    }
    
    setFormData({ 
        ...product, 
        imageUrl: product.image || (product as any).imageUrl || '', 
        images: gallery 
    });
    setOemString(product.oemNumbers ? product.oemNumbers.join(', ') : '');
    setCompatString(product.compatibility ? product.compatibility.join(', ') : '');
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
      if (!window.confirm('Delete this product permanently?')) return;
      try {
          await apiClient.delete(`/products/${id}`);
          fetchProducts(pagination.page);
      } catch (error: any) {
          alert(error.response?.data?.error || 'Delete failed.');
      }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku) return alert('Name and SKU are required.');
    setIsSaving(true);
    try {
        const payload = { 
            ...formData, 
            oemNumbers: oemString.split(',').map(s => s.trim()).filter(s => s.length > 0), 
            compatibility: compatString.split(',').map(s => s.trim()).filter(s => s.length > 0), 
            price: parseFloat(formData.price), 
            costPrice: parseFloat(formData.costPrice || 0), 
            wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : undefined, 
            quantity: parseInt(formData.quantity || 0) 
        };
        if (formData.id) await apiClient.put(`/products/${formData.id}`, payload);
        else await apiClient.post('/products', payload);
        setIsEditorOpen(false); fetchProducts(pagination.page); 
    } catch (error: any) { alert(error.response?.data?.error || 'Save failed.'); } finally { setIsSaving(false); }
  };

  const toggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (checked: boolean) => {
      if (checked) {
          setSelectedIds(products.map(p => p.id));
      } else {
          setSelectedIds([]);
      }
  };

  return (
    <div className="h-full flex flex-col font-sans">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase tracking-tight">Product Manager</h2>
                <p className="text-sm text-gray-500">Inventory control for Masuma Autoparts East Africa Limited.</p>
            </div>
            <div className="flex gap-2">
                <div className="relative group">
                    <button onClick={() => setIsNuclearOpen(!isNuclearOpen)} className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded font-bold uppercase text-[10px] hover:bg-red-50 flex items-center gap-2">
                        <ShieldAlert size={14} /> Advanced Recovery <ChevronDown size={12}/>
                    </button>
                    {isNuclearOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white shadow-2xl rounded border border-gray-100 z-50 overflow-hidden animate-scale-up">
                            <button onClick={handleClearAll} className="w-full text-left px-4 py-3 text-[10px] font-bold text-red-600 hover:bg-red-600 hover:text-white transition uppercase border-b border-gray-100 flex items-center gap-2">
                                <Trash2 size={12}/> Wipe Catalog (Clear All)
                            </button>
                            <button onClick={() => setIsNuclearOpen(false)} className="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-400 hover:bg-gray-50 uppercase">Close</button>
                        </div>
                    )}
                </div>
                <button onClick={() => setIsDiscountModalOpen(true)} className="bg-white border border-gray-300 text-masuma-orange px-4 py-2 rounded font-bold uppercase text-[10px] hover:bg-orange-50 flex items-center gap-2">
                    <Percent size={14} /> Global Adjust
                </button>
                <button onClick={() => { setImportStep('upload'); setBulkFile(null); setDryRunReport(null); setIsBulkModalOpen(true); }} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-bold uppercase text-[10px] hover:bg-gray-50 flex items-center gap-2">
                    <Upload size={14} /> Bulk Import
                </button>
                <button onClick={handleAddNew} className="bg-masuma-orange text-white px-4 py-2 rounded font-bold uppercase text-[10px] hover:bg-orange-600 flex items-center gap-2 shadow-md">
                    <Plus size={14} /> Add Product
                </button>
            </div>
        </div>

        {/* PRICE ADJUSTMENT MODAL */}
        {isDiscountModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white w-full max-w-sm rounded-lg shadow-2xl p-8 animate-scale-up border-t-4 border-masuma-orange">
                    <h3 className="text-xl font-bold text-masuma-dark uppercase mb-2">Price Adjustment</h3>
                    <p className="text-xs text-gray-500 mb-8 leading-relaxed">Adjust all catalog prices by a percentage. Positive values increase prices; negative values apply a discount.</p>
                    <div className="mb-8">
                        <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block tracking-widest">Percentage Change (%)</label>
                        <div className="relative">
                            <input type="number" step="0.1" className="w-full p-4 border-2 border-gray-200 rounded text-3xl font-bold focus:border-masuma-orange outline-none pr-12 text-center" value={discountPercentage} onChange={e => setDiscountPercentage(e.target.value)} autoFocus />
                            <span className="absolute right-4 top-4 text-3xl font-bold text-gray-300">%</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setIsDiscountModalOpen(false)} className="flex-1 py-3 border rounded font-bold uppercase text-xs hover:bg-gray-50">Cancel</button>
                        <button onClick={handleGlobalAdjustment} disabled={isAdjusting} className="flex-1 py-3 bg-masuma-orange text-white rounded font-bold uppercase text-xs hover:bg-orange-600 shadow-lg flex items-center justify-center gap-2">
                            {isAdjusting ? <Loader2 className="animate-spin" size={16}/> : 'Apply to All'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* EDITOR MODAL */}
        {isEditorOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                <div className="bg-white w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                    <div className="bg-masuma-dark text-white p-5 flex justify-between items-center border-b-4 border-masuma-orange">
                        <h3 className="font-bold uppercase tracking-wider">{formData.id ? 'Edit Part Details' : 'Register New Part'}</h3>
                        <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase text-masuma-orange border-b border-orange-100 pb-2 flex items-center gap-2">
                                    <Package size={14}/> Core Information
                                </h4>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Part Name *</label>
                                    <input type="text" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none text-sm font-bold shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Masuma SKU *</label>
                                        <input type="text" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono uppercase text-sm shadow-inner" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Category</label>
                                        <select className="w-full p-3 border border-gray-300 rounded bg-white outline-none text-sm shadow-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Retail (KES)</label>
                                        <input type="number" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-bold text-sm shadow-inner" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Cost Price</label>
                                        <input type="number" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none text-sm shadow-inner" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Quantity</label>
                                        <input type="number" className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none text-sm shadow-inner" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Description</label>
                                    <textarea className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-24 text-sm resize-none shadow-inner" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase text-masuma-orange border-b border-orange-100 pb-2 flex items-center gap-2">
                                        <Link size={14}/> Technical Specs
                                    </h4>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">OEM Numbers (Comma Separated)</label>
                                        <textarea className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-20 font-mono text-[11px] uppercase resize-none shadow-inner" value={oemString} onChange={e => setOemString(e.target.value)} placeholder="90915-10001, 90915-YZZE1..."></textarea>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Compatibility</label>
                                        <textarea className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-20 text-[11px] resize-none shadow-inner" value={compatString} onChange={e => setCompatString(e.target.value)} placeholder="Toyota Corolla, Nissan Note..."></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Media & Assets */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase text-masuma-orange border-b border-orange-100 pb-2 flex items-center gap-2">
                                        <ImageIcon size={14}/> Product Gallery
                                    </h4>
                                    
                                    <div className="bg-white p-4 border rounded-lg shadow-inner">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-[10px] font-black uppercase text-gray-400">Manage Images</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    className="hidden" 
                                                    multiple
                                                    accept="image/*" 
                                                    onChange={handleFileUpload}
                                                />
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="px-4 py-2 bg-masuma-orange text-white rounded font-bold uppercase text-[10px] hover:bg-orange-600 transition flex items-center gap-2 shadow-md"
                                                >
                                                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} Add Image
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {(formData.images || []).map((imgUrl: string, idx: number) => (
                                                <div key={idx} className={`relative aspect-square border rounded overflow-hidden transition-all ${formData.imageUrl === imgUrl ? 'border-green-500 ring-2 ring-green-100 scale-105' : 'border-gray-200'} bg-gray-50 group`}>
                                                    <img src={imgUrl} className="h-full w-full object-contain" alt={`Asset ${idx}`} />
                                                    
                                                    {/* Tooltips/Overlay */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                                        <button 
                                                            onClick={() => setAsMain(imgUrl)}
                                                            className={`w-full py-1 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1 transition ${formData.imageUrl === imgUrl ? 'bg-green-500 text-white' : 'bg-white text-masuma-dark hover:bg-gray-100'}`}
                                                        >
                                                            {formData.imageUrl === imgUrl ? <Check size={10} /> : <Star size={10} />}
                                                            {formData.imageUrl === imgUrl ? 'Current Main' : 'Set as Main'}
                                                        </button>
                                                        <button 
                                                            onClick={() => removeImage(imgUrl)}
                                                            className="w-full py-1 text-[9px] font-bold uppercase rounded bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-1"
                                                        >
                                                            <Trash2 size={10} /> Remove
                                                        </button>
                                                    </div>

                                                    {/* Main Badge */}
                                                    {formData.imageUrl === imgUrl && (
                                                        <div className="absolute top-1 left-1 bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
                                                            <Check size={8} /> MAIN
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {(!formData.images || formData.images.length === 0) && (
                                                <div className="col-span-full py-10 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-300">
                                                    <ImageIcon size={32} className="mb-2" />
                                                    <span className="text-[10px] font-bold uppercase text-center">No images uploaded yet.<br/>Upload more than one to create a gallery.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">YouTube Video URL</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                className="w-full p-3 pl-10 border border-gray-300 rounded focus:border-masuma-orange outline-none text-sm font-mono shadow-inner" 
                                                value={formData.videoUrl || ''} 
                                                onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
                                                placeholder="https://youtube.com/..."
                                            />
                                            <Video className="absolute left-3 top-3.5 text-gray-300" size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end gap-4 bg-white">
                        <button onClick={() => setIsEditorOpen(false)} className="px-6 py-2 text-gray-500 font-bold uppercase text-xs">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="bg-masuma-dark text-white px-10 py-2 rounded font-bold uppercase text-xs hover:bg-masuma-orange transition flex items-center gap-2 shadow-lg">
                            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save Part
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ... (Bulk Wizard and List View remain unchanged but kept for completeness of file content) ... */}
        {isBulkModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
                    <div className="bg-masuma-dark text-white p-5 flex justify-between items-center border-b-4 border-masuma-orange">
                        <h3 className="font-bold uppercase tracking-wider flex items-center gap-2">
                            <FileSpreadsheet size={20}/> Bulk Importer
                        </h3>
                        <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                    </div>
                    <div className="bg-gray-100 px-6 py-3 flex gap-8 items-center border-b border-gray-200">
                        {['Upload', 'Validate', 'Finish'].map((step, idx) => (
                             <div key={step} className={`flex items-center gap-2 text-[10px] font-bold uppercase ${importStep.toLowerCase() === step.toLowerCase() ? 'text-masuma-orange' : 'text-gray-400'}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${importStep.toLowerCase() === step.toLowerCase() ? 'bg-masuma-orange text-white' : 'bg-gray-300 text-white'}`}>{idx+1}</span> {step}
                             </div>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                        {importStep === 'upload' && (
                            <div className="space-y-6">
                                <div onClick={() => csvInputRef.current?.click()} className={`p-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition ${bulkFile ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-masuma-orange bg-white'}`}>
                                    <UploadCloud className="text-gray-300 mb-3" size={48}/>
                                    <span className="text-sm font-bold text-gray-500">{bulkFile ? bulkFile.name : 'Select CSV File'}</span>
                                    <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">Columns: SKU, Name, Category, Price, Description, Image URL, Video URL</p>
                                    <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={e => setBulkFile(e.target.files?.[0] || null)} />
                                </div>
                                <button onClick={() => handleBulkSubmit(true)} disabled={!bulkFile || isImporting} className="w-full bg-masuma-dark text-white py-4 rounded font-bold uppercase tracking-widest hover:bg-masuma-orange disabled:opacity-50 transition">
                                    {isImporting ? <Loader2 className="animate-spin mx-auto"/> : 'Analyze Data'}
                                </button>
                            </div>
                        )}
                        {importStep === 'validate' && dryRunReport && (
                            <div className="space-y-6">
                                <div className="flex gap-4 mb-4">
                                    <div className="bg-white p-4 border rounded flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">New Items</p>
                                        <p className="text-2xl font-bold text-green-600">{dryRunReport.created}</p>
                                    </div>
                                    <div className="bg-white p-4 border rounded flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Updates</p>
                                        <p className="text-2xl font-bold text-masuma-orange">{dryRunReport.updated}</p>
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded overflow-hidden max-h-60 overflow-y-auto">
                                    <table className="w-full text-left text-[10px]">
                                        <thead className="bg-gray-100 text-gray-500 font-bold uppercase sticky top-0">
                                            <tr><th className="p-3">Row</th><th className="p-3">SKU</th><th className="p-3">Result</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {dryRunReport.reports.map((r: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="p-3">{r.row}</td>
                                                    <td className="p-3 font-bold">{r.sku}</td>
                                                    <td className={`p-3 font-medium ${r.status === 'ERROR' ? 'text-red-600' : 'text-gray-600'}`}>{r.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button onClick={() => handleBulkSubmit(false)} disabled={isImporting} className="w-full bg-green-600 text-white py-4 rounded font-bold uppercase tracking-widest hover:bg-green-700 transition">
                                    Finalize Import
                                </button>
                            </div>
                        )}
                        {importStep === 'success' && (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <CheckCircle size={64} className="text-green-500 mb-4 animate-scale-up"/>
                                <h3 className="text-xl font-bold text-masuma-dark mb-2">Import Successful!</h3>
                                <p className="text-gray-500 mb-8">{importStatus?.success}</p>
                                <div className="flex flex-col gap-3 w-full max-w-xs">
                                    <button onClick={() => setIsBulkModalOpen(false)} className="bg-masuma-dark text-white py-3 rounded font-bold uppercase text-xs">Close Wizard</button>
                                    {importStatus?.batchId && (
                                        <button onClick={() => handleRollback(importStatus.batchId!)} className="text-red-500 font-bold uppercase text-[10px] flex items-center justify-center gap-1 hover:bg-red-50 p-2 rounded">
                                            <RotateCcw size={14}/> Mapping mixed up? Undo this import session
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white rounded shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white text-sm" placeholder="Filter Part Number or Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                </div>
                {selectedIds.length > 0 && (
                    <button 
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="bg-red-600 text-white px-4 py-2 rounded font-bold text-[10px] uppercase shadow-md flex items-center gap-2 hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {isBulkDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14}/>} 
                        Delete {selectedIds.length} Selected
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 uppercase font-bold text-[10px] border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 w-10">
                                <input 
                                    type="checkbox" 
                                    checked={products.length > 0 && selectedIds.length === products.length}
                                    onChange={e => toggleSelectAll(e.target.checked)} 
                                />
                            </th>
                            <th className="px-6 py-3">Part Info</th>
                            <th className="px-6 py-3">SKU</th>
                            <th className="px-6 py-4 text-right">Retail (KES)</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-masuma-orange"/></td></tr>
                        ) : products.map(product => (
                            <tr key={product.id} className={`hover:bg-gray-50 group ${selectedIds.includes(product.id) ? 'bg-orange-50' : ''}`}>
                                <td className="px-6 py-3">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(product.id)} 
                                        onChange={() => toggleSelect(product.id)} 
                                    />
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded border bg-white flex items-center justify-center overflow-hidden shrink-0">
                                            {product.image ? (
                                                <img src={product.image} className="h-full w-full object-contain" alt="" />
                                            ) : (
                                                <ImageIcon size={20} className="text-gray-200" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800 line-clamp-1">{product.name}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">{product.category}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3 font-mono text-xs text-masuma-dark font-bold">{product.sku}</td>
                                <td className="px-6 py-3 font-bold text-right text-masuma-dark">{product.price.toLocaleString()}</td>
                                <td className="px-6 py-3">
                                    {(product.quantity || 0) > 5 ? <span className="text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-0.5 rounded">{product.quantity} In Stock</span> : <span className="text-red-600 font-bold text-[10px] uppercase bg-red-50 px-2 py-0.5 rounded">Restock ({product.quantity || 0})</span>}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleEdit(product)} className="p-1.5 text-gray-400 hover:text-masuma-dark hover:bg-gray-100 rounded transition" title="Edit Part"><Edit2 size={14}/></button>
                                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Delete Part"><Trash2 size={14}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">Page {pagination.page} of {pagination.pages}</span>
                <div className="flex gap-2">
                    <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronLeft size={16}/></button>
                    <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="p-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronRight size={16}/></button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProductManager;