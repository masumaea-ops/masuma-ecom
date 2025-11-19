
import React, { useState } from 'react';
import { ArrowLeft, Clock, Calendar, Share2, ArrowRight, BookOpen } from 'lucide-react';
import { BlogPost, Product } from '../types';
import { BLOG_POSTS, PRODUCTS } from '../constants';

interface BlogProps {
  addToCart: (product: Product) => void;
}

const Blog: React.FC<BlogProps> = ({ addToCart }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Helper to find related products
  const getRelatedProducts = (category: string) => {
    return PRODUCTS.filter(p => p.category === category && p.stock).slice(0, 4);
  };

  if (selectedPost) {
    // Single Post View
    const relatedProducts = getRelatedProducts(selectedPost.relatedProductCategory);

    return (
      <div className="animate-fade-in bg-white min-h-screen">
        {/* Article Header */}
        <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-masuma-dark/50 z-10"></div>
          <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-12 max-w-7xl mx-auto">
            <button 
              onClick={() => setSelectedPost(null)}
              className="absolute top-6 left-6 md:left-12 text-white hover:text-masuma-orange transition flex items-center gap-2 font-bold uppercase text-sm tracking-wider bg-black/20 backdrop-blur-md px-4 py-2 rounded-full"
            >
              <ArrowLeft size={16} /> Back to Blog
            </button>
            
            <span className="text-masuma-orange font-bold uppercase tracking-widest text-xs mb-3 bg-black/60 w-fit px-3 py-1 backdrop-blur-sm">
              {selectedPost.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white font-display max-w-4xl leading-tight mb-4">
              {selectedPost.title}
            </h1>
            <div className="flex items-center gap-6 text-gray-300 text-sm font-medium">
               <span className="flex items-center gap-2"><Calendar size={16} className="text-masuma-orange" /> {selectedPost.date}</span>
               <span className="flex items-center gap-2"><Clock size={16} className="text-masuma-orange" /> {selectedPost.readTime}</span>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Article */}
          <div className="lg:col-span-2">
             <div className="prose prose-lg prose-headings:font-display prose-headings:uppercase prose-headings:text-masuma-dark prose-a:text-masuma-orange max-w-none text-gray-600">
                <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
             </div>

             {/* Share Section */}
             <div className="mt-12 border-t border-gray-200 pt-8 flex items-center justify-between">
                <p className="font-bold text-masuma-dark uppercase text-sm">Share this article:</p>
                <div className="flex gap-4">
                   <button className="p-2 bg-gray-100 rounded-full hover:bg-masuma-orange hover:text-white transition"><Share2 size={18} /></button>
                </div>
             </div>
          </div>

          {/* Sidebar / Related Products */}
          <div className="lg:col-span-1">
             <div className="sticky top-24">
                <div className="bg-gray-50 p-6 border-t-4 border-masuma-orange shadow-lg rounded-sm">
                   <h3 className="text-xl font-bold text-masuma-dark font-display uppercase mb-6 flex items-center gap-2">
                      <BookOpen size={20} className="text-masuma-orange" />
                      Related Parts
                   </h3>
                   <p className="text-sm text-gray-500 mb-6">
                      Based on this article, we recommend these verified Masuma components for your vehicle.
                   </p>
                   
                   <div className="space-y-4">
                      {relatedProducts.map(product => (
                         <div key={product.id} className="bg-white p-3 flex gap-3 shadow-sm hover:shadow-md transition border border-gray-100 group">
                            <div className="w-16 h-16 bg-gray-100 shrink-0 overflow-hidden">
                               <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            </div>
                            <div className="flex-1">
                               <h4 className="font-bold text-masuma-dark text-xs uppercase leading-tight mb-1">{product.name}</h4>
                               <p className="text-masuma-orange font-bold text-sm">KES {product.price.toLocaleString()}</p>
                               <button 
                                  onClick={() => addToCart(product)}
                                  className="mt-2 text-[10px] font-bold uppercase bg-masuma-dark text-white px-3 py-1 hover:bg-masuma-orange transition w-full text-center"
                               >
                                  Add to Cart
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    );
  }

  // Blog Grid View
  return (
    <div className="animate-fade-in bg-white min-h-screen">
      <div className="bg-masuma-dark text-white py-20 relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
         <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <span className="text-masuma-orange font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Masuma Knowledge Center</span>
            <h1 className="text-4xl md:text-6xl font-bold font-display uppercase tracking-tight mb-6">Expert Insights</h1>
            <div className="h-1 w-24 bg-masuma-orange mx-auto mb-6"></div>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
               Technical advice, maintenance tips, and industry news from the engineers who know your car best.
            </p>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
               <div 
                  key={post.id} 
                  className="group bg-white border border-gray-200 hover:shadow-2xl transition-all duration-300 flex flex-col h-full cursor-pointer transform hover:-translate-y-1"
                  onClick={() => setSelectedPost(post)}
               >
                  <div className="relative h-56 overflow-hidden">
                     <div className="absolute top-4 left-4 z-10">
                        <span className="bg-masuma-orange text-white text-[10px] font-bold uppercase px-2 py-1 shadow-md">
                           {post.category}
                        </span>
                     </div>
                     <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out"
                     />
                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition"></div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                     <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                     </div>
                     <h3 className="text-xl font-bold text-masuma-dark font-display mb-3 leading-tight group-hover:text-masuma-orange transition-colors">
                        {post.title}
                     </h3>
                     <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                        {post.excerpt}
                     </p>
                     <div className="flex items-center text-masuma-dark font-bold uppercase text-xs tracking-widest group-hover:text-masuma-orange transition mt-auto">
                        Read Article <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-2 transition" />
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Blog;
