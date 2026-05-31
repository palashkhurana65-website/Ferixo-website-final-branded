"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client"; 
import { Star, MessageSquare, ImagePlus, X, Loader2, CheckCircle2 } from "lucide-react";

export default function ProductReviews({ productId }: { productId: string }) {
  const supabase = createClient();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ average: 0, total: 0 });
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    const fetchProductReviews = async () => {
      try {
        // 1. Check for logged-in user
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        // 2. Fetch approved reviews specifically for THIS product
        const { data: reviewsData, error } = await supabase
          .from("Review")
          .select("*, Profile(fullName)")
          .eq("productId", productId)
          .eq("status", "approved") 
          .order("created_at", { ascending: false });
          
        if (error) throw error;

        if (reviewsData && reviewsData.length > 0) {
          setReviews(reviewsData);
          
          const totalRating = reviewsData.reduce((acc, rev) => acc + rev.rating, 0);
          setStats({
            average: Number((totalRating / reviewsData.length).toFixed(1)),
            total: reviewsData.length
          });
        }
      } catch (err) {
        console.error("Error fetching product reviews:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductReviews();
  }, [productId, supabase]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const selectedFiles = Array.from(e.target.files);
    const validFiles: File[] = [];

    if (files.length + selectedFiles.length > 3) {
      alert("You can only upload up to 3 media files.");
      return;
    }

    for (const file of selectedFiles) {
      const isVideo = file.type.startsWith('video/');
      if (isVideo && file.size > 20 * 1024 * 1024) { alert(`Video exceeds 20MB limit.`); continue; }
      if (!isVideo && file.size > 5 * 1024 * 1024) { alert(`Image exceeds 5MB limit.`); continue; }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      setPreviews((prev) => [...prev, ...validFiles.map(file => URL.createObjectURL(file))]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, i) => i !== indexToRemove));
    setPreviews(previews.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("Uploading media...");

    try {
      const uploadedMediaUrls: string[] = [];
      const authorIdentifier = user?.id || "guest";

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const safeName = `${productId}/${authorIdentifier}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('ferixo-ugc').upload(safeName, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error("Failed to upload media.");

        const { data: publicUrlData } = supabase.storage.from('ferixo-ugc').getPublicUrl(safeName);
        uploadedMediaUrls.push(publicUrlData.publicUrl);
      }

      setSubmitMessage("Publishing review...");

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productId,
          userId: user?.id || null,
          guestName: guestName,
          rating: rating,
          content: content,
          media: uploadedMediaUrls
        })
      });

      if (!res.ok) throw new Error("Failed to post review");

      setSubmitMessage("Success! Your review is live.");
      
      // Auto-refresh just the reviews section to show the new data instantly
      setTimeout(() => {
        window.location.reload(); 
      }, 1000);

    } catch (error: any) {
      setSubmitMessage(error.message || "An error occurred.");
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-16 border-t border-gray-100 pt-16">
      
      {/* HEADER STATS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-primary mb-2 flex items-center gap-3">
            <MessageSquare size={28} /> Customer Reviews
          </h2>
          {stats.total > 0 ? (
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-brand-blue">{stats.average.toFixed(1)}</div>
              <div>
                <div className="flex gap-1 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < Math.round(stats.average) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                  ))}
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Based on {stats.total} reviews</p>
              </div>
            </div>
          ) : (
             <p className="text-gray-500 font-medium">Be the first to review this product!</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* LEFT COLUMN: THE REVIEW FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-black text-primary">Share Your Thoughts</h3>
              
              {!user && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Name</label>
                  <input required type="text" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-medium text-primary" placeholder="John Doe" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                      <Star size={32} className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Review</label>
                <textarea required rows={4} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none resize-none font-medium text-primary placeholder:text-gray-400" placeholder="What did you love about it?" value={content} onChange={(e) => setContent(e.target.value)} />
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Attach Media (Max 3)</p>
                <div className="flex flex-wrap gap-3">
                  {files.length < 3 && (
                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue transition-colors cursor-pointer group">
                      <ImagePlus size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                      <input type="file" accept="image/*,video/mp4,video/quicktime" multiple className="hidden" onChange={handleFileSelect} />
                    </label>
                  )}
                  {previews.map((src, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                      {files[index].type.startsWith('video/') ? <video src={src} className="w-full h-full object-cover" /> : <img src={src} className="w-full h-full object-cover" />}
                      <button type="button" onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full"><X size={12} className="font-bold" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting || !content.trim()} className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Publishing...</> : "Post Review"}
              </button>

              {submitMessage && (
                <div className={`p-4 rounded-xl text-sm font-bold text-center ${submitMessage.includes("Success") ? "bg-green-50 text-green-700" : "bg-blue-50 text-brand-blue"}`}>
                  {submitMessage}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: REVIEWS FEED */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
             <div className="py-20 text-center text-gray-400 font-bold animate-pulse">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="bg-gray-50 border border-gray-100 rounded-3xl p-12 text-center">
              <p className="text-gray-500 font-medium">No reviews have been published for this product yet.</p>
            </div>
          ) : (
            reviews.map((review) => {
              const authorName = review.Profile?.fullName || review.guestName || "Verified Customer";
              
              return (
                <div key={review.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-blue font-black uppercase text-lg">
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-primary leading-tight capitalize">
                          {authorName}
                        </p>
                        {/* Verified Customer Badge */}
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                          <CheckCircle2 size={10} strokeWidth={3} /> Verified
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-400 font-bold border-l border-gray-200 pl-2 uppercase tracking-wide">
                          {new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-800 leading-relaxed font-medium mb-6">{review.content}</p>
                  
                  {review.media && review.media.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {review.media.map((url: string, i: number) => (
                        <div key={i} className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                           {url.match(/\.(mp4|mov|webm)$/i) ? (
                              <video src={url} className="w-full h-full object-cover" muted playsInline loop onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()}/>
                           ) : (
                              <img src={url} alt="Review media" className="w-full h-full object-cover" />
                           )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}