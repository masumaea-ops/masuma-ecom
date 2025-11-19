
import React, { useState } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, X, Save, Image as ImageIcon } from 'lucide-react';
import { PRODUCTS } from '../../constants';
import { Category, Product } from '../../types';

const ProductManager: React.FC = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  const filtered = PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Product Inventory</h2>
          <p className="text-sm text-gray-500">Manage catalog items, pricing, and OEM mappings.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-masuma-orange text-white px-6 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-orange-600 transition shadow-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Toolbar */}
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
        <div className="flex items-center gap-2">
           <button className="px-4 py-2 border border-gray-300 rounded text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-sm font-bold">
             <Filter size={16} /> Filter
           </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Product Detail</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price (KES)</th>
                <th className="px-6 py-4">OEM Count</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-200">
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-masuma-dark text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.category}</td>
                  <td className="px-6 py-4 font-bold text-masuma-dark">{product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-bold">{product.oemNumbers.length} Codes</span>
                  </td>
                  <td className="px-6 py-4">
                    {product.stock ? (
                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold uppercase">Active</span>
                    ) : (
                      <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold uppercase">Out of Stock</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-masuma-orange"><Edit2 size={16} /></button>
                      <button className="p-2 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Editor */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditorOpen(false)}></div>
          <div className="relative w-full md:w-[600px] bg-white h-full shadow-2xl flex flex-col animate-slide-right">
            
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-masuma-dark text-white">
              <h3 className="font-bold text-lg uppercase tracking-wider">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
              <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-600">Product Name</label>
                <input type="text" defaultValue={editingProduct?.name} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-600">SKU (Part No)</label>
                  <input type="text" defaultValue={editingProduct?.sku} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-600">Category</label>
                  <select className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none bg-white">
                    {Object.values(Category).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-xs font-bold uppercase text-gray-600">Price (KES)</label>
                   <input type="number" defaultValue={editingProduct?.price} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold uppercase text-gray-600">Wholesale Price</label>
                   <input type="number" defaultValue={editingProduct?.wholesalePrice} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none" />
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-600">Image URL</label>
                <div className="flex gap-2">
                   <input type="text" defaultValue={editingProduct?.image} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none text-sm text-gray-500" />
                   <button className="p-3 bg-gray-200 rounded hover:bg-gray-300"><ImageIcon size={20} /></button>
                </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold uppercase text-gray-600">OEM Numbers (Comma Separated)</label>
                 <textarea defaultValue={editingProduct?.oemNumbers.join(', ')} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-24 font-mono text-sm"></textarea>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold uppercase text-gray-600">Description</label>
                 <textarea defaultValue={editingProduct?.description} className="w-full p-3 border border-gray-300 rounded focus:border-masuma-orange outline-none h-32"></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
              <button onClick={() => setIsEditorOpen(false)} className="px-6 py-3 border border-gray-300 rounded font-bold text-gray-600 uppercase text-sm hover:bg-gray-50">Cancel</button>
              <button className="px-6 py-3 bg-masuma-dark text-white rounded font-bold uppercase text-sm hover:bg-masuma-orange flex items-center gap-2">
                <Save size={18} /> Save Changes
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
