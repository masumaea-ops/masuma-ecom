
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Loader2, UploadCloud, Download, Upload, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { apiClient } from '../../utils/apiClient';

const ProductManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  
  // Editor State
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [oemString, setOemString] = useState(''); 
  const [compatString, setCompatString] = useState(''); 
  
  // Import/Export State
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Refs for file inputs
  const csvInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    try {
        const res = await apiClient.get(`/products?q=${searchTerm}&page=${page}&limit=${pagination.limit}`);
        if (res.data && res.data.data) {
            setProducts(res.data.data);
            setPagination(res.data.meta);
        } else {
            // Fallback for non-paginated response
            setProducts(res.data);
        }
    } catch (error) {
        console.error('Failed to fetch products', error);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
      try {
          const res = await apiClient.get('/categories');
          setCategories(res.data);
      } catch (error) {
          console.error('Failed to fetch categories', error);
      }
  };

  useEffect(() => {
    const debounce = setTimeout(() => fetchProducts(1), 500);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  useEffect(() => {
      fetchCategories();
  }, []);

  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= pagination.pages) {
          fetchProducts(newPage);
      }
  };

  const handleAddNew = () => {
    setFormData({
        name: '', sku: '', price: '', costPrice: '', wholesalePrice: '', quantity: '',
        description: '', category: categories[0]?.name || 'General', image: '', images: [], oemNumbers: [], compatibility: []
    });
    setOemString('');
    setCompatString('');
    setIsEditorOpen(true);
  };

  const handleEdit = (product: Product) => {
    setFormData({
        ...product,
        images: product.images || (product.image ? [product.image] : [])
    });
    setOemString(product.oemNumbers ? product.oemNumbers.join(', ') : '');
    setCompatString(product.compatibility ? product.compatibility.join(', ') : '');
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        await apiClient.delete(`/products/${id}`);
        fetchProducts(pagination.page);
        alert('Product deleted successfully.');
    } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete product.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'video') => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const uploadData = new FormData();
      uploadData.append('image', file);

      try {
          const res = await apiClient.post('/upload', uploadData);
          
          if (res.data && res.data.url) {
              const url = res.data.url;
              if (field === 'image') {
                  setFormData((prev: any) => {
                      const currentImages = prev.images || [];
                      const updatedImages = [...currentImages, url];
                      return {
                          ...prev,
                          image: prev.image ? prev.image : url,
                          images: updatedImages
                      };
                  });
              } else {
                  setFormData((prev: any) => ({ ...prev, videoUrl: url }));
              }
          } else {
              throw new Error('Invalid response from server');
          }
      } catch (error: any) {
          console.error("Upload Error:", error);
          alert('Upload failed: ' + (error.response?.data?.error || error.message));
      } finally {
          setIsUploading(false);
          if (imageInputRef.current) imageInputRef.current.value = '';
      }
  };

  const handleSetPrimaryImage = (url: string) => {
      setFormData((prev: any) => ({ ...prev, image: url }));
  };

  const handleRemoveImage = (urlToRemove: string) => {
      setFormData((prev: any) => {
          const updatedImages = prev.images.filter((img: string) => img !== urlToRemove);
          let newPrimary = prev.image;
          if (prev.image === urlToRemove) {
              newPrimary = updatedImages.length > 0 ? updatedImages[0] : '';
          }
          return {
              ...prev,
              images: updatedImages,
              image: newPrimary
          };
      });
  };

  // Robust number cleaner to prevent NaN
  const cleanNumber = (str: any) => {
      if (str === null || str === undefined || str === '') return 0;
      // Remove all non-numeric chars except digits, minus sign, and dot
      // This strips currency symbols, commas, etc.
      const clean = String(str).replace(/[^\d.-]/g, '');
      if (clean === '') return 0;
      const num = parseFloat(clean);
      return (typeof num === 'number' && isFinite(num)) ? num : 0;
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku || (!formData.price && formData.price !== 0)) {
        alert('Please fill in all required fields (Name, SKU, Price).');
        return;
    }

    setIsSaving(true);
    try {
        const payload = {
            ...formData,
            oemNumbers: oemString.split(',').map(s => s.trim()).filter(s => s.length > 0),
            compatibility: compatString.split(',').map(s => s.trim()).filter(s => s.length > 0),
            price: cleanNumber(formData.price),
            costPrice: cleanNumber(formData.costPrice),
            wholesalePrice: cleanNumber(formData.wholesalePrice),
            quantity: cleanNumber(formData.quantity),
            imageUrl: formData.image, 
            images: formData.images 
        };

        if (formData.id) {
            await apiClient.put(`/products/${formData.id}`, payload);
        } else {
            await apiClient.post('/products', payload);
        }

        setIsEditorOpen(false);
        fetchProducts(pagination.page); 
    } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to save product. Check inputs.');
        console.error(error);
    } finally {
        setIsSaving(false);
    }
  };

  // --- CSV FUNCTIONS ---

  const handleExport = async () => {
      setIsExporting(true);
      try {
          const res = await apiClient.get('/products?limit=100000');
          const allProducts = res.data.data || res.data || [];

          const headers = ['SKU', 'Name', 'Category', 'Price (Retail)', 'Quantity', 'Cost Price', 'Wholesale Price', 'Description', 'OEM Numbers', 'Compatible Vehicles', 'Image URL'];
          
          const rows = allProducts.map((p: any) => [
              p.sku,
              `"${p.name.replace(/"/g, '""')}"`,
              p.category,
              p.price,
              p.quantity || 0,
              p.costPrice || 0,
              p.wholesalePrice || 0,
              `"${(p.description || '').replace(/"/g, '""')}"`,
              `"${(p.oemNumbers || []).join('|')}"`,
              `"${(p.compatibility || []).join('|')}"`,
              p.image
          ].join(','));

          const csvContent = [headers.join(','), ...rows].join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `masuma_inventory_export_${new Date().toISOString().slice(0,10)}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      } catch (error) {
          alert('Export failed. Please try again.');
      } finally {
          setIsExporting(false);
      }
  };

  const handleImportClick = () => {
      csvInputRef.current?.click();
  };

  const parseCSVLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuote = false;
      
      for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
              inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
              result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
              current = '';
          } else {
              current += char;
          }
      }
      result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      return result;
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
          const text = evt.target?.result as string;
          const lines = text.split('\n');
          if (lines.length < 2) {
              alert("CSV file is empty or invalid format.");
              setIsImporting(false);
              return;
          }

          const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

          const getColumnIndex = (candidates: string[], exclusions: string[] = []) => {
              return headers.findIndex(h => {
                  const matchesCandidate = candidates.some(c => h.includes(c));
                  const matchesExclusion = exclusions.some(e => h.includes(e));
                  return matchesCandidate && !matchesExclusion;
              });
          };

          const importedProducts = [];
          
          for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue;
              const values = parseCSVLine(lines[i]);
              
              const getRawValue = (candidates: string[], exclusions: string[] = []) => {
                  const idx = getColumnIndex(candidates, exclusions);
                  if (idx === -1) return '';
                  let val = values[idx] || '';
                  return val.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
              };

              const sku = getRawValue(['sku', 'part no', 'code', 'part_number']);
              const name = getRawValue(['name', 'product', 'description', 'item', 'title']) || 'Imported Product';

              if (sku) {
                  // Price Logic - Robust check to avoid NaN
                  const priceStr = getRawValue(['retail', 'selling', 'price', 'srp'], ['cost', 'wholesale', 'buying']);
                  const price = cleanNumber(priceStr);

                  const costStr = getRawValue(['cost', 'buying', 'purchase']);
                  const costPrice = cleanNumber(costStr);

                  const wholesaleStr = getRawValue(['wholesale', 'trade', 'dealer']);
                  const wholesalePrice = cleanNumber(wholesaleStr);

                  const quantityStr = getRawValue(['qty', 'quantity', 'stock', 'count']);
                  const quantity = Math.floor(cleanNumber(quantityStr));

                  // Oems (Handle pipe or comma sep)
                  const oemRaw = getRawValue(['oem', 'cross', 'ref', 'original']);
                  const oemNumbers = oemRaw.replace(/\|/g, ',');

                  const compatRaw = getRawValue(['vehicle', 'fit', 'compat', 'model']);
                  const compatibility = compatRaw.replace(/\|/g, ',');

                  const category = getRawValue(['category', 'group', 'cat']) || 'General';
                  const description = getRawValue(['desc', 'detail', 'info']);
                  const imageUrl = getRawValue(['image', 'url', 'photo', 'link']);

                  importedProducts.push({
                      sku,
                      name,
                      category,
                      price, // Guaranteed number
                      costPrice,
                      wholesalePrice,
                      description,
                      quantity,
                      oemNumbers,
                      compatibility,
                      imageUrl
                  });
              }
          }

          try {
              // Inject Branch ID from User Session
              const userStr = localStorage.getItem('masuma_user');
              const user = userStr ? JSON.parse(userStr) : {};
              const branchId = user.branch?.id;

              if (!branchId) throw new Error("Branch ID missing. Please relogin.");

              const res = await apiClient.post('/products/bulk', { 
                  branchId,
                  products: importedProducts 
              });
              
              alert(`Import Successful!\nCreated: ${res.data.created}\nUpdated: ${res.data.updated}`);
              fetchProducts(1);
          } catch (error: any) {
              console.error(error);
              alert('Import Failed: ' + (error.response?.data?.error || error.message));
          } finally {
              setIsImporting(false);
              if (csvInputRef.current) csvInputRef.current.value = '';
          }
      };
      
      reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Product Manager</h2>
                <p className="text-sm text-gray-500">Manage catalog, pricing, and specifications.</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded font-bold uppercase text-xs hover:bg-gray-50 flex items-center gap-2"
                >
                    {isExporting ? <Loader2 className="animate-spin" size={16}/> : <Download size={16} />} Export CSV
                </button>
                <div className="relative">
                    <input 
                        type="file" 
                        ref={csvInputRef} 
                        className="hidden" 
                        accept=".csv"
                        onChange={handleImportFile}
                    />
                    <button 
                        onClick={handleImportClick}
                        disabled={isImporting}
                        className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded font-bold uppercase text-xs hover:bg-gray-50 flex items-center gap-2"
                    >
                        {isImporting ? <Loader2 className="animate-spin" size={16}/> : <Upload size={16} />} Import CSV
                    </button>
                </div>
                <button 
                    onClick={handleAddNew}
                    className="bg-masuma-orange text-white px-4 py-2 rounded font-bold uppercase text-xs hover:bg-orange-600 flex items-center gap-2 shadow-md"
                >
                    <Plus size={16} /> Add Product
                </button>
            </div>
        </div>

        {/* Editor Modal */}
        {isEditorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                    <div className="bg-masuma-dark text-white p-4 flex justify-between items-center">
                        <h3 className="font-bold uppercase tracking-wider">{formData.id ? 'Edit Product' : 'New Product'}</h3>
                        <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 space-y-4">
                                <h4 className="font-bold text-gray-500 text-xs uppercase border-b pb-2 mb-2">Core Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Part Name *</label>
                                        <input type="text" className="w-full p-2 border rounded focus:border-masuma-orange outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Oil Filter" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">SKU / Part No *</label>
                                        <input type="text" className="w-full p-2 border rounded focus:border-masuma-orange outline-none uppercase font-mono" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="MFC-112" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Category *</label>
                                    <select className="w-full p-2 border rounded focus:border-masuma-orange outline-none bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                                    <textarea className="w-full p-2 border rounded focus:border-masuma-orange outline-none h-20 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                                </div>
                            </div>

                            {/* Pricing & Stock */}
                            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 space-y-4">
                                <h4 className="font-bold text-gray-500 text-xs uppercase border-b pb-2 mb-2">Pricing & Inventory</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Retail Price (KES) *</label>
                                        <input type="number" className="w-full p-2 border rounded focus:border-masuma-orange outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Stock Quantity</label>
                                        <input type="number" className="w-full p-2 border rounded focus:border-masuma-orange outline-none" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Wholesale Price</label>
                                        <input type="number" className="w-full p-2 border rounded focus:border-masuma-orange outline-none" value={formData.wholesalePrice} onChange={e => setFormData({...formData, wholesalePrice: e.target.value})} placeholder="Optional" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Cost Price</label>
                                        <input type="number" className="w-full p-2 border rounded focus:border-masuma-orange outline-none" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} placeholder="Optional" />
                                    </div>
                                </div>
                            </div>

                            {/* Technical Specs */}
                            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 space-y-4 md:col-span-2">
                                <h4 className="font-bold text-gray-500 text-xs uppercase border-b pb-2 mb-2">Technical Specifications</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">OEM Numbers (Comma Separated)</label>
                                        <textarea 
                                            className="w-full p-2 border rounded focus:border-masuma-orange outline-none h-24 font-mono text-xs uppercase" 
                                            value={oemString} 
                                            onChange={e => setOemString(e.target.value)}
                                            placeholder="90915-10001, 90915-YZZE1..."
                                        ></textarea>
                                        <p className="text-[10px] text-gray-400 mt-1">Used for cross-referencing search.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Compatible Vehicles (Comma Separated)</label>
                                        <textarea 
                                            className="w-full p-2 border rounded focus:border-masuma-orange outline-none h-24 text-xs" 
                                            value={compatString} 
                                            onChange={e => setCompatString(e.target.value)}
                                            placeholder="Toyota Corolla, Toyota Vitz, Subaru Forester..."
                                        ></textarea>
                                        <p className="text-[10px] text-gray-400 mt-1">Used for 'Fits' check.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Media */}
                            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 space-y-4 md:col-span-2">
                                <h4 className="font-bold text-gray-500 text-xs uppercase border-b pb-2 mb-2">Media & Images</h4>
                                <div className="flex gap-4 items-start">
                                    {/* Image List */}
                                    <div className="flex-1 flex gap-2 overflow-x-auto pb-2">
                                        {formData.images && formData.images.length > 0 ? (
                                            formData.images.map((img: string, idx: number) => (
                                                <div key={idx} className="relative w-24 h-24 rounded border border-gray-200 shrink-0 group">
                                                    <img src={img} className="w-full h-full object-cover rounded" alt="Product" />
                                                    <button 
                                                        onClick={() => handleRemoveImage(img)}
                                                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                    {formData.image === img && (
                                                        <span className="absolute bottom-1 left-1 bg-masuma-orange text-white text-[8px] px-1 rounded uppercase font-bold">Main</span>
                                                    )}
                                                    {formData.image !== img && (
                                                        <button 
                                                            onClick={() => handleSetPrimaryImage(img)}
                                                            className="absolute bottom-1 left-1 bg-white/90 text-gray-600 text-[8px] px-1 rounded uppercase font-bold opacity-0 group-hover:opacity-100 hover:text-masuma-orange"
                                                        >
                                                            Set Main
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-24 h-24 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                                                No Images
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Button */}
                                    <div className="shrink-0">
                                        <input 
                                            type="file" 
                                            ref={imageInputRef} 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={(e) => handleFileUpload(e, 'image')}
                                        />
                                        <button 
                                            onClick={() => imageInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-24 h-24 rounded border-2 border-dashed border-masuma-orange bg-orange-50 text-masuma-orange flex flex-col items-center justify-center hover:bg-orange-100 transition"
                                        >
                                            {isUploading ? <Loader2 className="animate-spin" size={20}/> : <UploadCloud size={20} />}
                                            <span className="text-[10px] font-bold uppercase mt-1">Upload</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Video URL (Optional)</label>
                                    <input type="text" className="w-full p-2 border rounded focus:border-masuma-orange outline-none" value={formData.videoUrl || ''} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
                        <button onClick={() => setIsEditorOpen(false)} className="px-6 py-2 border rounded text-gray-500 font-bold uppercase text-xs hover:bg-gray-50">Cancel</button>
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="bg-masuma-dark text-white px-8 py-2 rounded font-bold uppercase text-xs hover:bg-masuma-orange transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                            {formData.id ? 'Update Product' : 'Create Product'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Product List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded outline-none focus:border-masuma-orange bg-white" 
                        placeholder="Search SKU or Name..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3">Product</th>
                            <th className="px-6 py-3">SKU</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Price</th>
                            <th className="px-6 py-3">Stock</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 group">
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden border border-gray-200">
                                            {product.image ? (
                                                <img src={product.image} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400"><Package size={16}/></div>
                                            )}
                                        </div>
                                        <span className="font-bold text-gray-800 line-clamp-1">{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 font-mono text-xs text-masuma-dark">{product.sku}</td>
                                <td className="px-6 py-3 text-xs text-gray-500">{product.category}</td>
                                <td className="px-6 py-3 font-bold">{product.price.toLocaleString()}</td>
                                <td className="px-6 py-3">
                                    {product.quantity > 5 ? (
                                        <span className="text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-1 rounded">{product.quantity} In Stock</span>
                                    ) : product.quantity > 0 ? (
                                        <span className="text-orange-600 font-bold text-[10px] uppercase bg-orange-50 px-2 py-1 rounded">{product.quantity} Low Stock</span>
                                    ) : (
                                        <span className="text-red-600 font-bold text-[10px] uppercase bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => handleEdit(product)} className="p-2 bg-gray-100 rounded hover:bg-masuma-orange hover:text-white transition"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(product.id)} className="p-2 bg-gray-100 rounded hover:bg-red-500 hover:text-white transition"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-400">No products found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">Page {pagination.page} of {pagination.pages}</span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="p-2 border rounded hover:bg-white disabled:opacity-50"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="p-2 border rounded hover:bg-white disabled:opacity-50"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProductManager;
