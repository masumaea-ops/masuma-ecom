
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, Share2, ArrowRight, BookOpen, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { BlogPost, Product } from '../types';
import { apiClient } from '../utils/apiClient';
import SEO from './SEO';

interface BlogProps {
  addToCart: (product: Product) => void;
  initialPostId?: string | null;
  onProductClick?: (product: Product) => void;
}

const Blog: React.FC<BlogProps> = ({ addToCart, initialPostId, onProductClick }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 6, total: 0, pages: 1 });
  const [copied, setCopied] = useState(false);

  // 1. Initial Data Fetch & Deep Link Check
  useEffect(() => {
      const init = async () => {
          setIsLoading(true);
          
          if (initialPostId) {
              try {
                  const res = await apiClient.get(`/blog/${initialPostId}`);
                  setSelectedPost(res.data);
              } catch (e) {
                  console.error("Deep link post not found");
              }
          } else {
              setSelectedPost(null);
          }

          // Always fetch the list for navigation if empty
          if (posts.length === 0) {
              await fetchPosts(1);
          }
          
          setIsLoading(false);
      };
      
      init();
  }, [initialPostId]);

  const fetchPosts = async (page: number) => {
      try {
          const res = await apiClient.get(`/blog?page=${page}&limit=${pagination.limit}`);

          if (res.data && res.data.data) {
              setPosts(res.data.data);
              setPagination(res.data.meta);
          } else if (Array.isArray(res.data)) {
              setPosts(res.data);
          }
      } catch (error) {
          console.error('Failed to fetch blog posts');
      }
  };

  // 2. Handle Post Selection (Update URL)
  const handleSelectPost = (e: React.MouseEvent, post: BlogPost) => {
      e.preventDefault();
      setSelectedPost(post);
      const newUrl = `${window.location.pathname}?post=${post.id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 3. Handle Back Navigation (Clean URL)
  const handleBack = () => {
      setSelectedPost(null);
      const cleanUrl = window.location.pathname;
      window.history.pushState({ path: cleanUrl }, '', cleanUrl);
  };

  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= pagination.pages) {
          setIsLoading(true);
          fetchPosts(newPage).then(() => {
              setIsLoading(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
          });
      }
  };

  useEffect(() => {
      if (selectedPost) {
          const fetchRelated = async () => {
              try {
                  const res = await apiClient.get(`/products?category=${selectedPost.relatedProductCategory}`);
                  const productsData = res.data.data || res.data; 
                  setRelatedProducts(Array.isArray(productsData) ? productsData.slice(0, 4) : []);
              } catch (e) {
                  setRelatedProducts([]);
              }
          };
          fetchRelated();
      }
  }, [selectedPost]);

  const handleShare = async () => {
    if (!selectedPost) return;

    // Use current URL which now contains ?post=ID
    const shareUrl = window.location.href; 

    const shareData = {
        title: selectedPost.title,
        text: selectedPost.excerpt,
        url: shareUrl
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy');
        }
    }
  };

  if (selectedPost) {
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": selectedPost.title,
        "image": selectedPost.image,
        "datePublished": selectedPost.date,
        "author": {
            "@type": "Organization",
            "name": "Masuma Autoparts EA"
        },
        "description": selectedPost.excerpt
    };

    return (
      <div className="animate-fade-in bg-white min-h-screen">
        <SEO 
            title={selectedPost.title} 
            description={selectedPost.excerpt} 
            image={selectedPost.image} 
            type="article" 
            schema={articleSchema}
        />
        <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-masuma-dark/50 z-10"></div>
          <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-12 max-w-screen-2xl mx-auto">
            <button 
              onClick={handleBack}
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

        <div className="max-w-screen-2xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2">
             <div className="prose prose-lg prose-headings:font-display prose-headings:uppercase prose-headings:text-masuma-dark prose-a:text-masuma-orange max-w-none text-gray-600">
                <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
             </div>

             <div className="mt-12 border-t border-gray-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="font-bold text-masuma-dark uppercase text-sm">Share this article:</p>
                <div className="flex items-center gap-4">
                   <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-masuma-orange hover:text-white transition font-bold text-xs uppercase tracking-wider"
                   >
                       {copied ? <Check size={16} /> : <Share2 size={16} />}
                       {copied ? 'Link Copied' : 'Share Link'}
                   </button>
                </div>
             </div>
          </div>

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
                      {relatedProducts.length > 0 ? relatedProducts.map(product => (
                         <div 
                            key={product.id} 
                            onClick={(e) => {
                                if (onProductClick) {
                                    e.preventDefault();
                                    onProductClick(product);
                                }
                            }}
                            className="bg-white p-3 flex gap-3 shadow-sm hover:shadow-md transition border border-gray-100 group cursor-pointer"
                         >
                            <div className="w-16 h-16 bg-gray-100 shrink-0 overflow-hidden">
                               <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            </div>
                            <div className="flex-1">
                               <h4 className="font-bold text-masuma-dark text-xs uppercase leading-tight mb-1 group-hover:text-masuma-orange transition">{product.name}</h4>
                               <p className="text-masuma-orange font-bold text-sm">KES {product.price.toLocaleString()}</p>
                               <button 
                                  onClick={(e) => {
                                      e.stopPropagation(); // Prevent opening modal if clicking Add to Cart directly
                                      addToCart(product);
                                  }}
                                  className="mt-2 text-[10px] font-bold uppercase bg-masuma-dark text-white px-3 py-1 hover:bg-masuma-orange transition w-full text-center"
                               >
                                  Add to Cart
                               </button>
                            </div>
                         </div>
                      )) : (
                          <p className="text-xs text-gray-400 italic">Loading suggestions...</p>
                      )}
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-white min-h-screen">
      <SEO title="Blog & Insights" description="Automotive maintenance tips and Masuma product news for Kenya." />
      <div className="bg-masuma-dark text-white py-20 relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
         <div className="max-w-screen-2xl mx-auto px-4 relative z-10 text-center">
            <span className="text-masuma-orange font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Masuma Knowledge Center</span>
            <h1 className="text-4xl md:text-6xl font-bold font-display uppercase tracking-tight mb-6">Expert Insights</h1>
            <div className="h-1 w-24 bg-masuma-orange mx-auto mb-6"></div>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
               Technical advice, maintenance tips, and industry news from the engineers who know your car best.
            </p>
         </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 py-16">
         {isLoading ? (
             <div className="flex justify-center items-center h-64">
                 <Loader2 className="animate-spin text-masuma-orange" size={48} />
             </div>
         ) : (
         <>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                   <a 
                      key={post.id}
                      href={`/?post=${post.id}`} 
                      className="group bg-white border border-gray-200 hover:shadow-2xl transition-all duration-300 flex flex-col h-full cursor-pointer transform hover:-translate-y-1 block"
                      onClick={(e) => handleSelectPost(e, post)}
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
                   </a>
                ))}
             </div>
             
             {/* Pagination Controls */}
             {pagination.pages > 1 && (
                 <div className="mt-16 flex justify-center items-center gap-4">
                    <button 
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-xs uppercase tracking-wider text-gray-600"
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            let pNum = i + 1;
                            // Adjust window if deeply paginated
                            if (pagination.pages > 5) {
                                if (pagination.page > 3) pNum = pagination.page - 2 + i;
                                if (pNum > pagination.pages) pNum = pagination.pages - (4 - i);
                            }
                            return (
                                <button
                                    key={pNum}
                                    onClick={() => handlePageChange(pNum)}
                                    className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition ${
                                        pagination.page === pNum 
                                        ? 'bg-masuma-dark text-white' 
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {pNum}
                                </button>
                            );
                        })}
                    </div>

                    <button 
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-xs uppercase tracking-wider text-gray-600"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                 </div>
             )}
         </>
         )}
      </div>
    </div>
  );
};

export default Blog;
