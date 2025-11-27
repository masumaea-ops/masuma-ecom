
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Calendar, Image as ImageIcon, Save, X, Loader2, UploadCloud, Bold, Italic, List, ListOrdered, Link as LinkIcon, Heading1, Quote, Code } from 'lucide-react';
import { BlogPost } from '../../types';
import { apiClient } from '../../utils/apiClient';

const BlogManager: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [formData, setFormData] = useState<Partial<BlogPost>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Posts
            const postsRes = await apiClient.get('/blog?limit=100');
            if (postsRes.data && postsRes.data.data) {
                setPosts(postsRes.data.data);
            } else {
                setPosts([]);
            }

            // Fetch Categories
            const catRes = await apiClient.get('/categories');
            if (catRes.data) {
                setCategories(catRes.data.map((c: any) => c.name));
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddNew = () => {
        setFormData({
            title: '',
            category: 'General',
            readTime: '5 min read',
            image: '',
            content: '',
            excerpt: '',
            relatedProductCategory: categories[0] || 'Filters'
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
                headers: { 'Content-Type': undefined } // Let browser handle multipart
            });
            if (res.data && res.data.url) {
                setFormData(prev => ({ ...prev, image: res.data.url }));
            } else {
                throw new Error('Invalid server response');
            }
        } catch (error: any) {
            console.error(error);
            alert('Upload failed: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // --- Rich Text Logic ---
    const insertFormat = (startTag: string, endTag: string = '') => {
        const textarea = contentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.content || '';
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        // If link, ask for URL
        let finalStartTag = startTag;
        if (startTag === '<a href="') {
            const url = prompt('Enter URL:', 'https://');
            if (!url) return;
            finalStartTag = `<a href="${url}" target="_blank" class="text-masuma-orange hover:underline">`;
        }

        const newText = `${before}${finalStartTag}${selection}${endTag}${after}`;
        
        // React state update
        setFormData({ ...formData, content: newText });

        // Restore focus
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + finalStartTag.length, end + finalStartTag.length);
        }, 0);
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
            fetchData();
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
            fetchData();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Content Studio</h2>
                    <p className="text-sm text-gray-500">Manage blog posts and technical articles.</p>
                </div>
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
                                onChange={e => setFormData({...formData, relatedProductCategory: e.target.value})}
                                className="w-full p-3 border border-gray-200 rounded outline-none focus:border-masuma-orange bg-white"
                             >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
                             <label className="text-xs font-bold uppercase text-gray-500 flex justify-between items-center">
                                 <span>Body Content</span>
                                 <span className="text-[10px] text-gray-400">HTML Supported</span>
                             </label>
                             
                             {/* Rich Text Toolbar */}
                             <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-t border border-gray-200 border-b-0 overflow-x-auto">
                                 <button onClick={() => insertFormat('<b>', '</b>')} className="p-2 hover:bg-white hover:text-masuma-orange rounded transition" title="Bold"><Bold size={16}/></button>
                                 <button onClick={() => insertFormat('<i>', '</i>')} className="p-2 hover:bg-white hover:text-masuma-orange rounded transition" title="Italic"><Italic size={16}/></button>
                                 <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                 <button onClick={() => insertFormat('<h3>', '</h3>')} className="p-2 hover:bg-white hover:text-masuma-orange rounded transition" title="Heading"><Heading1 size={16}/></button>
                                 <button onClick={() => insertFormat('<blockquote>', '</blockquote>')} className="p-2 hover:bg-white hover:text-masuma-orange rounded transition" title="Quote"><Quote size={16}/></button>
                                 <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                 <button onClick={() => insertFormat('<ul>\n<li>', '</li>\n</ul>')} className="p-2 hover:bg-white hover:text-masuma-orange rounded transition" title="Bullet List"><List size={16}/></button>
                                 <button onClick={() => insertFormat('<ol>\n<li>', '</li>\n</ol>')} className="p-2 hover:bg-white hover:text-masuma-orange rounded transition" title="Numbered List"><ListOrdered size={16}/></button>
                                 <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                 <button onClick={() => insertFormat('<a href="', '">Link</a>')} className="p-2 hover:bg-white hover:text-masuma-orange rounded transition" title="Hyperlink"><LinkIcon size={16}/></button>
                                 <button onClick={() => insertFormat('<p>', '</p>')} className="p-2 hover:bg-white hover:text-masuma-orange rounded transition" title="Paragraph"><Code size={16}/></button>
                             </div>

                             <textarea 
                                ref={contentRef}
                                value={formData.content}
                                onChange={e => setFormData({...formData, content: e.target.value})}
                                className="w-full h-96 p-4 border border-gray-200 rounded-b outline-none focus:border-masuma-orange font-mono text-sm leading-relaxed resize-none" 
                                placeholder="Write your article here. Use the toolbar above to format text."
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
                    <div className="w-full lg:w-[450px] bg-gray-50 border-l border-gray-200 flex flex-col h-[80vh] lg:h-auto">
                        <h4 className="text-xs font-bold uppercase text-gray-400 p-4 bg-gray-100 border-b border-gray-200">Live Preview</h4>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md mb-6">
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

                            {/* Content Body Preview */}
                            <div className="prose prose-sm max-w-none text-gray-600 prose-headings:font-display prose-headings:uppercase prose-a:text-masuma-orange">
                                {formData.content ? (
                                    <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                                ) : (
                                    <p className="italic text-gray-400">Start typing to see how your content will look on the website...</p>
                                )}
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
