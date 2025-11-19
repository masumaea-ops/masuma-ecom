
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, Calendar, Image as ImageIcon, Save, X, Loader2, UploadCloud } from 'lucide-react';
import { BlogPost, Category } from '../../types';
import { apiClient } from '../../utils/apiClient';

const BlogManager: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [formData, setFormData] = useState<Partial<BlogPost>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/blog');
            setPosts(res.data);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleAddNew = () => {
        setFormData({
            title: '',
            category: 'General',
            readTime: '5 min read',
            image: '',
            content: '',
            excerpt: '',
            relatedProductCategory: Category.FILTERS
        });
        setIsEditing(true);
    };

    const handleEdit = (post: BlogPost) => {
        setFormData(post);
        setIsEditing(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const res = await apiClient.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, image: res.data.url }));
        } catch (error) {
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) return alert('Title and Content are required');
        setIsSaving(true);
        try {
            if (formData.id) {
                await apiClient.put(`/blog/${formData.id}`, formData);
            } else {
                await apiClient.post('/blog', formData);
            }
            setIsEditing(false);
            fetchPosts();
        } catch (error) {
            console.error('Failed to save post', error);
            alert('Failed to save post');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await apiClient.delete(`/blog/${id}`);
            fetchPosts();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Content Studio</h2>
                <button 
                    onClick={handleAddNew}
                    className="bg-masuma-orange text-white px-6 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-orange-600 transition shadow-lg flex items-center gap-2"
                >
                    <Plus size={18} /> New Article
                </button>
            </div>

            {isEditing ? (
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col lg:flex-row animate-slide-up">
                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                         <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-gray-500">Article Title</label>
                             <input 
                                type="text" 
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full text-3xl font-bold font-display text-masuma-dark border-b border-gray-200 pb-2 outline-none focus:border-masuma-orange placeholder:text-gray-300" 
                                placeholder="Enter Title Here..." 
                             />
                         </div>
                         
                         <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                 <label className="text-xs font-bold uppercase text-gray-500">Category</label>
                                 <input 
                                    type="text" 
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                    className="w-full p-3 border border-gray-200 rounded outline-none focus:border-masuma-orange" 
                                    placeholder="e.g. Maintenance" 
                                 />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-xs font-bold uppercase text-gray-500">Read Time</label>
                                 <input 
                                    type="text" 
                                    value={formData.readTime}
                                    onChange={e => setFormData({...formData, readTime: e.target.value})}
                                    className="w-full p-3 border border-gray-200 rounded outline-none focus:border-masuma-orange" 
                                    placeholder="e.g. 5 min read" 
                                 />
                             </div>
                         </div>
                         
                         <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-gray-500">Related Product Category</label>
                             <select 
                                value={formData.relatedProductCategory}
                                onChange={e => setFormData({...formData, relatedProductCategory: e.target.value as Category})}
                                className="w-full p-3 border border-gray-200 rounded outline-none focus:border-masuma-orange bg-white"
                             >
                                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                         </div>

                         <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-gray-500">Featured Image</label>
                             <div className="flex gap-2">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileUpload}
                                />
                                <input 
                                    type="text" 
                                    value={formData.image}
                                    onChange={e => setFormData({...formData, image: e.target.value})}
                                    className="w-full p-3 border border-gray-200 rounded outline-none focus:border-masuma-orange font-mono text-sm" 
                                    placeholder="https://..." 
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="p-3 bg-gray-100 rounded hover:bg-masuma-orange hover:text-white text-gray-500 transition flex items-center gap-2"
                                >
                                    {isUploading ? <Loader2 size={20} className="animate-spin"/> : <UploadCloud size={20} />}
                                </button>
                             </div>
                         </div>
                         
                         <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-gray-500">Excerpt (Short Summary)</label>
                             <textarea 
                                value={formData.excerpt}
                                onChange={e => setFormData({...formData, excerpt: e.target.value})}
                                className="w-full p-3 border border-gray-200 rounded outline-none focus:border-masuma-orange text-sm h-24 resize-none"
                                placeholder="Brief description for the card view..."
                             ></textarea>
                         </div>

                         <div className="space-y-2 h-full">
                             <label className="text-xs font-bold uppercase text-gray-500">Content (HTML/Markdown)</label>
                             <textarea 
                                value={formData.content}
                                onChange={e => setFormData({...formData, content: e.target.value})}
                                className="w-full h-96 p-4 border border-gray-200 rounded outline-none focus:border-masuma-orange font-mono text-sm leading-relaxed resize-none" 
                                placeholder="Write your story here (HTML supported)..."
                             ></textarea>
                         </div>

                         <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                             <button onClick={() => setIsEditing(false)} className="px-6 py-2 text-gray-500 font-bold uppercase text-sm hover:text-masuma-dark">Cancel</button>
                             <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="px-8 py-3 bg-masuma-dark text-white font-bold uppercase tracking-widest rounded hover:bg-masuma-orange transition flex items-center gap-2 disabled:opacity-50"
                             >
                                 {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                 {isSaving ? 'Publishing...' : 'Publish'}
                             </button>
                         </div>
                    </div>

                    {/* Live Preview Sidebar */}
                    <div className="w-96 bg-gray-50 border-l border-gray-200 p-6 hidden lg:block">
                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-4">Card Preview</h4>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md">
                             <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400 overflow-hidden">
                                 {formData.image ? (
                                     <img src={formData.image} className="w-full h-full object-cover" alt="" />
                                 ) : (
                                     <ImageIcon size={32} />
                                 )}
                             </div>
                             <div className="p-4">
                                 <span className="text-[10px] font-bold text-masuma-orange uppercase bg-orange-50 px-2 py-1 rounded">{formData.category || 'Category'}</span>
                                 <h3 className="text-lg font-bold text-masuma-dark mt-2 leading-tight">{formData.title || 'Article Title'}</h3>
                                 <p className="text-xs text-gray-500 mt-2 line-clamp-3">{formData.excerpt || 'Excerpt will appear here...'}</p>
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="animate-spin text-masuma-orange" size={32} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map((post) => (
                                <div key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition group">
                                    <div className="relative h-48">
                                        <img src={post.image} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition bg-white/80 backdrop-blur-sm rounded p-1">
                                            <button onClick={() => handleEdit(post)} className="p-2 hover:text-masuma-orange"><Edit size={14} /></button>
                                            <button onClick={() => handleDelete(post.id)} className="p-2 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                            <Calendar size={12} /> {post.date}
                                        </div>
                                        <h3 className="font-bold text-masuma-dark text-lg leading-tight mb-2 line-clamp-2">{post.title}</h3>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{post.category}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {posts.length === 0 && (
                                <div className="col-span-3 text-center py-12 text-gray-400">
                                    No blog posts found. Create one to get started.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BlogManager;
