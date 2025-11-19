
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Calendar, Image as ImageIcon } from 'lucide-react';
import { BLOG_POSTS } from '../../constants';
import { BlogPost } from '../../types';

const BlogManager: React.FC = () => {
    const [posts, setPosts] = useState(BLOG_POSTS);
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-masuma-dark font-display uppercase">Content Studio</h2>
                <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-masuma-orange text-white px-6 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-orange-600 transition shadow-lg flex items-center gap-2"
                >
                    <Plus size={18} /> New Article
                </button>
            </div>

            {isEditing ? (
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col lg:flex-row">
                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                         <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-gray-500">Article Title</label>
                             <input type="text" className="w-full text-3xl font-bold font-display text-masuma-dark border-b border-gray-200 pb-2 outline-none focus:border-masuma-orange placeholder:text-gray-300" placeholder="Enter Title Here..." />
                         </div>
                         
                         <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                 <label className="text-xs font-bold uppercase text-gray-500">Category</label>
                                 <input type="text" className="w-full p-3 border border-gray-200 rounded outline-none focus:border-masuma-orange" placeholder="e.g. Maintenance" />
                             </div>
                             <div className="space-y-2">
                                 <label className="text-xs font-bold uppercase text-gray-500">Read Time</label>
                                 <input type="text" className="w-full p-3 border border-gray-200 rounded outline-none focus:border-masuma-orange" placeholder="e.g. 5 min read" />
                             </div>
                         </div>

                         <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-gray-500">Featured Image URL</label>
                             <div className="flex gap-2">
                                <input type="text" className="w-full p-3 border border-gray-200 rounded outline-none focus:border-masuma-orange font-mono text-sm" placeholder="https://..." />
                                <button className="p-3 bg-gray-100 rounded hover:bg-gray-200 text-gray-500"><ImageIcon size={20} /></button>
                             </div>
                         </div>

                         <div className="space-y-2 h-full">
                             <label className="text-xs font-bold uppercase text-gray-500">Content (HTML/Markdown)</label>
                             <textarea className="w-full h-96 p-4 border border-gray-200 rounded outline-none focus:border-masuma-orange font-mono text-sm leading-relaxed resize-none" placeholder="Write your story here..."></textarea>
                         </div>

                         <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                             <button onClick={() => setIsEditing(false)} className="px-6 py-2 text-gray-500 font-bold uppercase text-sm hover:text-masuma-dark">Cancel</button>
                             <button onClick={() => setIsEditing(false)} className="px-8 py-3 bg-masuma-dark text-white font-bold uppercase tracking-widest rounded hover:bg-masuma-orange transition">Publish</button>
                         </div>
                    </div>

                    {/* Live Preview Sidebar */}
                    <div className="w-96 bg-gray-50 border-l border-gray-200 p-6 hidden lg:block">
                        <h4 className="text-xs font-bold uppercase text-gray-400 mb-4">Card Preview</h4>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md">
                             <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                                 <ImageIcon size={32} />
                             </div>
                             <div className="p-4">
                                 <span className="text-[10px] font-bold text-masuma-orange uppercase bg-orange-50 px-2 py-1 rounded">Category</span>
                                 <h3 className="text-lg font-bold text-masuma-dark mt-2 leading-tight">Enter Title Here...</h3>
                                 <p className="text-xs text-gray-500 mt-2 line-clamp-2">Article excerpt will appear here...</p>
                             </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <div key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition group">
                             <div className="relative h-48">
                                 <img src={post.image} alt="" className="w-full h-full object-cover" />
                                 <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                     <button className="p-2 bg-white rounded-full shadow-sm hover:text-masuma-orange"><Edit size={14} /></button>
                                     <button className="p-2 bg-white rounded-full shadow-sm hover:text-red-500"><Trash2 size={14} /></button>
                                 </div>
                             </div>
                             <div className="p-4">
                                 <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                     <Calendar size={12} /> {post.date}
                                 </div>
                                 <h3 className="font-bold text-masuma-dark text-lg leading-tight mb-2">{post.title}</h3>
                                 <div className="flex items-center justify-between mt-4">
                                     <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{post.category}</span>
                                     <button className="text-masuma-orange hover:text-masuma-dark"><Eye size={18} /></button>
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlogManager;
