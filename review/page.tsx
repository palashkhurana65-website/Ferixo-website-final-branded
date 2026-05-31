"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";
import { Star, MessageSquare, ImagePlus, X, Loader2, Play, Quote } from "lucide-react";
import Link from "next/link";

export default function CommunityReviewsPage() {
  const supabase = createClient();
  
  // Data State
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<{url: string, productId: string}[]>([]);
  const [stats, setStats] = useState({ average: 0, total: 0 });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ productId: "", rating: 5, content: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        // 1. Get User
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        // 2. Fetch all approved reviews with Product Names
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("Review")
          .select("*, Product(name)")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (reviewsError) throw reviewsError;

        // 3. Fetch products for the review submission dropdown
        const { data: productsData } = await supabase
          .from("Product")
          .select("id, name")
          .order("name");

        if (productsData) {
          setProducts(productsData);
          if (productsData.length > 0) setFormData(p => ({ ...p, productId: productsData[0].id }));
        }

        if (reviewsData && reviewsData.length > 0) {
          setReviews(reviewsData);
          
          // Calculate Global Stats
          const totalRating = reviewsData.reduce((acc, rev) => acc + rev.rating, 0);
          setStats({
            average: Number((totalRating / reviewsData.length).toFixed(1)),
            total: reviewsData.length
          });

          // Extract all media for the top ribbon
          const allMedia: {url: string, productId: string}[] = [];
          reviewsData.forEach(rev => {
            if (rev.media && Array.isArray(rev.media)) {
             rev.media.forEach((url: string) => allMedia.push({ url, productId: rev.productId }));
            }
          });
          setMediaItems(allMedia);
        }
      } catch (err) {
        console.error("Error fetching community data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [supabase]);

  // Handle Media Selection for Modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    // Limits
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
    const validFiles: File[] = [];

    if (files.length + selectedFiles.length > 3) {
      alert("You can only upload up to 3 media files.");
      return;
    }

    for (const file of selectedFiles) {
      const isVideo = file.type.startsWith('video/');
      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        alert(`Video "${file.name}" exceeds 20MB limit.`);
        continue;
      }
      if (!isVideo && file.size > MAX_IMAGE_SIZE) {
        alert(`Image "${file.name}" exceeds 5MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setPreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setSubmitMessage("Uploading media...");

    try {
      const uploadedMediaUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const safeName = `${formData.productId}/${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('ferixo-ugc')
          .upload(safeName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error("Failed to upload media.");

        const { data: publicUrlData } = supabase.storage.from('ferixo-ugc').getPublicUrl(safeName);
        uploadedMediaUrls.push(publicUrlData.publicUrl);
      }

      setSubmitMessage("Posting review...");

      const { error: dbError } = await supabase.from("Review").insert([{
        productId: formData.productId,
        userId: user.id, 
        rating: formData.rating,
        content: formData.content,
        media: uploadedMediaUrls,
        status: "pending"
      }]);

      if (dbError) throw dbError;

      setSubmitMessage("Success! Your review is pending approval.");
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitMessage("");
        setFormData({ ...formData, content: "", rating: 5 });
        setFiles([]);
        setPreviews([]);
      }, 3000);

    } catch (error: any) {
      setSubmitMessage(error.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary font-bold animate-pulse">Loading Community...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* LAYER A: Hero Stats & Actions */}
      <section className="bg-white pt-24 pb-16 border-b border-gray-100 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-6">
            Loved by the Ferixo Community
          </h1>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-10">
            <div className="flex items-center gap-4">
              {/* FIX: Now strictly formats the number to 1 decimal place, even if it's 0 */}
              <div className="text-5xl font-black text-primary">
                {stats.total > 0 ? stats.average.toFixed(1) : "0.0"}
              </div>
              <div className="text-left">
                <div className="flex gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className={i < Math.round(stats.average) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                  ))}
                </div>
                <p className="text-sm font-bold text-gray-500">Based on {stats.total} verified reviews</p>
              </div>
            </div>
          </div>

          {!user ? (
            <Link href="/login" className="inline-block bg-brand-blue text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all">
              Log In to Write a Review
            </Link>
          ) : (
            <button onClick={() => setIsModalOpen(true)} className="bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-900 shadow-md transition-all flex items-center gap-2 mx-auto">
              <MessageSquare size={20} /> Write a Review
            </button>
          )}
        </div>
      </section>

      {/* LAYER B: Edge-to-Edge UGC Media Ribbon */}
      {mediaItems.length > 0 && (
        <section className="py-12 bg-white overflow-hidden">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-bold text-primary flex items-center gap-2"><ImagePlus size={20}/> Spotted in the Wild</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar">
              {mediaItems.map((item, idx) => (
                <Link key={idx} href={`/shop/${item.productId}`} className="relative w-48 h-64 flex-shrink-0 rounded-2xl overflow-hidden group snap-start shadow-sm border border-gray-100 cursor-pointer">
                  {item.url.match(/\.(mp4|mov|webm)$/i) ? (
                    <>
                      <video src={item.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted loop playsInline onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()} />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="bg-white/90 p-3 rounded-full backdrop-blur-sm"><Play size={20} className="text-primary fill-primary ml-1" /></div>
                      </div>
                    </>
                  ) : (
                    <img src={item.url} alt="UGC" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LAYER C: The Dynamic Masonry Wall */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        {reviews.length === 0 ? (
          <div className="text-center py-20 text-gray-500 font-medium">No reviews published yet.</div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="break-inside-avoid bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
                <Quote className="absolute top-6 right-6 text-gray-100" size={40} />
                
                <div className="flex gap-1 mb-4 relative z-10">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                  ))}
                </div>
                
                <p className="text-gray-800 leading-relaxed font-medium mb-6 relative z-10">"{review.content}"</p>
                
                {/* Media Attachments in Card */}
                {review.media && review.media.length > 0 && (
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2 relative z-10">
                    {review.media.map((url: string, i: number) => (
                      <div key={i} className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200">
                        {url.match(/\.(mp4|mov|webm)$/i) ? (
                          <video src={url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={url} className="w-full h-full object-cover" alt="review upload" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-50 pt-4 relative z-10 flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reviewed Product</span>
                  <Link href={`/shop/${review.productId}`} className="text-sm font-black text-brand-blue hover:text-blue-700 transition-colors">
                    {review.Product?.name || "Premium Item"}
                  </Link>
                  <span className="text-xs text-gray-400 mt-1 font-medium">
                    {new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* UNIVERSAL REVIEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-2xl font-black text-primary">Share Your Experience</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-brand-orange bg-gray-50 rounded-full"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Which product did you buy?</label>
                <select 
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:outline-none font-medium text-primary cursor-pointer"
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                >
                  <option value="" disabled>Select a product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setFormData({...formData, rating: star})} className="focus:outline-none hover:scale-110 transition-transform">
                      <Star size={32} className={star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Review</label>
                <textarea
                  required rows={4}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue focus:outline-none resize-none font-medium text-primary"
                  placeholder="What did you love about it?"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
              </div>

              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">Attach Photos or Video (Max 3)</p>
                <div className="flex flex-wrap gap-4">
                  {files.length < 3 && (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue cursor-pointer">
                      <ImagePlus size={20} className="mb-1" />
                      <input type="file" accept="image/*,video/mp4,video/quicktime" multiple className="hidden" onChange={handleFileSelect} />
                    </label>
                  )}
                  {previews.map((src, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                      {files[index].type.startsWith('video/') ? (
                        <video src={src} className="w-full h-full object-cover" />
                      ) : (
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      <button type="button" onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full"><X size={12} className="font-bold" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting || !formData.content.trim() || !formData.productId} className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
                {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Uploading...</> : "Submit Review"}
              </button>

              {submitMessage && (
                <div className={`p-4 rounded-xl text-sm font-bold text-center ${submitMessage.includes("Success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {submitMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}