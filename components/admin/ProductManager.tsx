
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Loader2, UploadCloud, Download, Upload, Package, Car, Image as ImageIcon, Star, Check, ChevronLeft, ChevronRight } from 'lucide-react';
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
        name: '', sku: '', price: 0, costPrice: 0, wholesalePrice: 0, 
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
          // Explicitly unset Content-Type to let the browser set the correct boundary
          const res = await apiClient.post('/upload', uploadData, {
              headers: { 'Content-Type': undefined }
          });
          
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
          // If we removed the primary image, set the first available one as primary, or empty
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

  const handleSave = async () => {
    if (!formData.name || !formData.sku || !formData.price) {
        alert('Please fill in all required fields (Name, SKU, Price).');
        return;
    }

    setIsSaving(true);
    try {
        const payload = {
            ...formData,
            oemNumbers: oemString.split(',').map(s => s.trim()).filter(s => s.length > 0),
            compatibility: compatString.split(',').map(s => s.trim()).filter(s => s.length > 0),
            price: Number(formData.price),
            costPrice: Number(formData.costPrice),
            wholesalePrice: Number(formData.wholesalePrice),
            quantity: Number(formData.quantity || 0),
            imageUrl: formData.image, // Ensure legacy field is populated
            images: formData.images // Ensure array is sent
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
          // Fetch all products for export (bypass pagination)
          const res = await apiClient.get('/products?limit=100000');
          const allProducts = res.data.data || res.data || [];

          const headers = ['SKU', 'Name', 'Category', 'Price (Retail)', 'Quantity', 'Cost Price', 'Wholesale Price', 'Description', 'OEM Numbers', 'Compatible Vehicles', 'Image URL'];
          
          const rows = allProducts.map((p: any) => [
              p.sku,
              `"${p.name.replace(/"/g, '""')}"`,
              p.category,
              p.price,
              p.quantity || 0, // Added Quantity
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

  const cleanNumber = (str: string) => {
      if (!str) return 0;
      const clean = str.replace(/[^\d.-]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
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

          const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
          const importedProducts = [];
          
          for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue;
              const values = parseCSVLine(lines[i]);
              
              const getVal = (headerPart: string) => {
                  const idx = headers.findIndex(h => h.includes(headerPart));
                  return idx > -1 ? values[idx] : '';
              };

              const sku = getVal('sku');
              const name = getVal('name');

              if (sku && name) {
                  importedProducts.push({
                      sku: sku,
                      name: name,
                      category: getVal('category') || 'General',
                      price: cleanNumber(getVal('retail') || getVal('price')),
                      costPrice: cleanNumber(getVal('cost')),
                      wholesalePrice: cleanNumber(getVal('wholesale')),
                      // Explicitly looking for Quantity column
                      quantity: parseInt(String(cleanNumber(getVal('qty') || getVal('quantity')))),
                      description: getVal('desc'),
                      oemNumbers: getVal('oem'), 
                      compatibility: getVal('compatible') || getVal('vehicle') || getVal('fits'), 
                      imageUrl: getVal('image')
                  });
              }
          }

          try {
              const user = JSON.parse(localStorage.getItem('masuma_user') || '{}');
              let branchId = user.branch?.id;
              
              if (!branchId) {
                  const bRes = await apiClient.get('/branches');
                  if (bRes.data && bRes.data.length > 0) branchId = bRes.data[0].id;
              }

              if (!branchId) throw new Error("No active branch found to initialize inventory.");

              await apiClient.post('/products/bulk', {
                  branchId,
                  products: importedProducts
              });
              
              alert(`Successfully processed ${importedProducts.length} products.`);
              fetchProducts(1); // Reset to page 1
          } catch (error: any) {
              console.error(error);
              alert('Import failed: ' + (error.response?.data?.error || error.message));
          } finally {
              setIsImporting(false);
              if (csvInputRef.current) csvInputRef.current.value = '';
          }
      };
      
      reader.readAsText(file);
  };

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Product Inventory</h2>
          <p className="text-sm text-gray-500">Manage catalog items, pricing, and OEM mappings.</p>
        </div>
        <div className="flex gap-2">
            <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={handleImportFile} />
            <button 
                onClick={handleImportClick}
                disabled={isImporting}
                className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded font-bold uppercase text-xs hover:bg-gray-50 transition flex items-center gap-2"
            >
                {isImporting ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16} />} Import CSV
            </button>
            <button 
                onClick={handleExport}
                disabled={isExporting}
                className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded font-bold uppercase text-xs hover:bg-gray-50 transition flex items-center gap-2"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />} Export CSV
            </button>
            <button 
            onClick={handleAddNew}
            className="bg-masuma-orange text-white px-6 py-2 rounded font-bold uppercase tracking-widest text-xs hover:bg-orange-600 transition shadow-md flex items-center gap-2"
            >
            <Plus size={16} /> Add Product
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
           <Search className="absolute left-3 top-3 text-gray-400" size={18} />
           <input 
              type="text" 
              placeholder="Search by Name, SKU or OEM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:border-masuma-orange outline-none"
           />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
              <div className="flex justify-center items-center h-64">
                  <Loader2 className="animate-spin text-masuma-orange" size={32} />
              </div>
          ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Product Detail</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price (KES)</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Cost (KES)</th>
                <th className="px-6 py-4">OEMs</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {products.map((product: any) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-200">
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-masuma-dark text-sm line-clamp-1">{product.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 font-bold text-masuma-dark">{product.price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${product.quantity > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {product.quantity || 0}
                      </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-500">{product.costPrice ? product.costPrice.toLocaleString() : '-'}</td>
                  <td className="px-6 py-4 text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-bold">{product.oemNumbers?.length} Codes</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-masuma-orange"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No products found.</td></tr>
              )}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-500 font-bold">
                Page {pagination.page} of {pagination.pages} ({pagination.total} Items)
            </span>
            <div className="flex gap-2">
                <button 
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>

      {isEditorOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditorOpen(false)}></div>
          <div className="relative w-full md:w-[600px] bg-white h-full shadow-2xl flex flex-col animate-slide-right">
            
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-masuma-dark text-white">
              <h3 className="font-bold text-lg uppercase tracking-wider">{formData.id ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              {/* Basic Info */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-600">Product Name *</label>
                <input 
                    type="text" 
                    value={formData.name || ''} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-600">SKU (Part No) *</label>
                  <input 
                    type="text" 
                    value={formData.sku || ''}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono"
                   />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-600">Category</label>
                  <select 
                    value={formData.category || ''}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none bg-white"
                  >
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                 <div className="space-y-1">
                   <label className="text-xs font-bold uppercase text-gray-600">Buying Price (Cost)</label>
                   <input 
                    type="number" 
                    value={formData.costPrice || ''}
                    onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none bg-yellow-50" 
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold uppercase text-gray-600">Selling Price *</label>
                   <input 
                    type="number" 
                    value={formData.price || ''}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" 
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold uppercase text-gray-600">Wholesale Price</label>
                   <input 
                    type="number" 
                    value={formData.wholesalePrice || ''}
                    onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" 
                   />
                 </div>
              </div>

              {/* Initial Stock */}
              <div className="space-y-1">
                   <label className="text-xs font-bold uppercase text-gray-600 flex items-center gap-1"><Package size={12}/> Stock Quantity (Active Branch)</label>
                   <input 
                    type="number" 
                    value={formData.quantity || 0}
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none bg-green-50" 
                    title="Updating this will adjust inventory for your current branch"
                   />
                   {formData.id && <p className="text-[10px] text-green-600 font-bold">Live Sync: Updates inventory immediately.</p>}
              </div>

              {/* Image Gallery & Upload */}
              <div className="space-y-2">
                 <label className="text-xs font-bold uppercase text-gray-600 flex items-center gap-2">
                    <ImageIcon size={14} /> Product Images
                 </label>
                 
                 {/* Main Upload Control */}
                 <div className="flex gap-2 mb-3">
                    <input 
                        type="file" 
                        ref={imageInputRef}
                        className="hidden" 
                        accept="image/*" 
                        multiple
                        onChange={(e) => handleFileUpload(e, 'image')}
                    />
                    
                    <input 
                        type="text" 
                        value={formData.image || ''} 
                        readOnly
                        className="flex-1 p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none text-sm text-gray-500 bg-gray-50"
                        placeholder="Primary Image URL"
                    />
                    <button 
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-4 py-2 bg-masuma-dark text-white rounded hover:bg-masuma-orange transition flex items-center gap-2 text-xs font-bold uppercase"
                    >
                        {isUploading ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16} />} Add Image
                    </button>
                 </div>

                 {/* Image Gallery Grid */}
                 {formData.images && formData.images.length > 0 && (
                     <div className="grid grid-cols-3 gap-3 bg-gray-100 p-3 rounded border border-gray-200">
                         {formData.images.map((img: string, idx: number) => (
                             <div 
                                key={idx} 
                                className={`relative group aspect-square bg-white rounded overflow-hidden border-2 cursor-pointer transition-all ${
                                    formData.image === img ? 'border-masuma-orange ring-2 ring-masuma-orange/20' : 'border-gray-200 hover:border-gray-400'
                                }`}
                                onClick={() => handleSetPrimaryImage(img)}
                             >
                                <img src={img} alt={`Product ${idx}`} className="w-full h-full object-contain p-1" />
                                
                                {/* Primary Badge */}
                                {formData.image === img && (
                                    <div className="absolute top-1 left-1 bg-masuma-orange text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                        <Star size={8} fill="currentColor" /> Primary
                                    </div>
                                )}

                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                    {formData.image !== img && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleSetPrimaryImage(img); }}
                                            className="p-1.5 bg-white rounded-full text-green-600 hover:bg-green-50 transition"
                                            title="Set as Primary"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(img); }}
                                        className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-50 transition"
                                        title="Remove Image"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                             </div>
                         ))}
                     </div>
                 )}
              </div>
              
              {/* Compatibility & OEM */}
              <div className="space-y-1">
                 <label className="text-xs font-bold uppercase text-gray-600">OEM Numbers (Comma Separated)</label>
                 <textarea 
                    value={oemString}
                    onChange={e => setOemString(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-20 font-mono text-sm"
                    placeholder="e.g. 90915-10001, 90915-YZZE1"
                 ></textarea>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold uppercase text-gray-600 flex items-center gap-1"><Car size={12}/> Compatible Vehicles (Comma Separated)</label>
                 <textarea 
                    value={compatString}
                    onChange={e => setCompatString(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-20 text-sm"
                    placeholder="e.g. Toyota Vitz, Subaru Forester, Nissan Note"
                 ></textarea>
              </div>

               <div className="space-y-1">
                 <label className="text-xs font-bold uppercase text-gray-600">Description</label>
                 <textarea 
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-24"
                 ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
              <button onClick={() => setIsEditorOpen(false)} className="px-6 py-3 border border-gray-300 rounded font-bold text-gray-600 uppercase text-sm hover:bg-gray-50">Cancel</button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-masuma-dark text-white rounded font-bold uppercase text-sm hover:bg-masuma-orange flex items-center gap-2 disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
