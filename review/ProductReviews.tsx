"use client";

import { useState, useEffect } from "react";
import { createClient } from "../lib/supabase/client"; 
import { Star, MessageSquare, ImagePlus, X, Loader2 } from "lucide-react";

export default function ProductReviews({ productId }: { productId: string }) {
  const supabase = createClient();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]); // NEW: Holds the selected raw files
  const [previews, setPreviews] = useState<string[]>([]); // NEW: Holds local preview URLs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setIsLoadingUser(false);
    };
    
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("Review")
        .select("*")
        .eq("productId", productId)
        .eq("status", "approved") 
        .order("created_at", { ascending: false });
        
      if (data) setReviews(data);
    };

    getUser();
    fetchReviews();
  }, [productId, supabase]);

  // NEW: Handle File Selection & Generate Local Previews
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const selectedFiles = Array.from(e.target.files);
    const validFiles: File[] = [];

    // Validation Constants
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB in bytes

    if (files.length + selectedFiles.length > 3) {
      alert("You can only upload up to 3 media files.");
      return;
    }

    // Loop through each selected file and validate it
    for (const file of selectedFiles) {
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        alert(`The video "${file.name}" is too large. Videos must be under 50MB.`);
        continue; // Skip this file
      }
      
      if (!isVideo && file.size > MAX_IMAGE_SIZE) {
        alert(`The image "${file.name}" is too large. Images must be under 10MB.`);
        continue; // Skip this file
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  // NEW: Remove a selected file before uploading
  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, i) => i !== indexToRemove));
    setPreviews(previews.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setSubmitMessage("Uploading media...");

    try {
      const uploadedMediaUrls: string[] = [];

      // 1. Upload files directly to Supabase Storage first
      for (const file of files) {
        // Create a unique clean filename: productId/userId-timestamp.ext
        const fileExt = file.name.split('.').pop();
        const safeName = `${productId}/${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('ferixo-ugc')
          .upload(safeName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error("Failed to upload image.");

        // 2. Get the public URL for the newly uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('ferixo-ugc')
          .getPublicUrl(safeName);

        uploadedMediaUrls.push(publicUrlData.publicUrl);
      }

      setSubmitMessage("Posting review...");

      // 3. Insert the review along with the new media URLs array
      const { error: dbError } = await supabase
        .from("Review")
        .insert([
          {
            productId: productId,
            userId: user.id, 
            rating: rating,
            content: content,
            media: uploadedMediaUrls, // NEW: Attach the URLs to the database!
            status: "pending"
          }
        ]);

      if (dbError) throw dbError;

      // 4. Reset Form on Success
      setSubmitMessage("Review submitted successfully! It will appear once approved.");
      setContent("");
      setRating(5);
      setFiles([]);
      setPreviews([]);

    } catch (error: any) {
      setSubmitMessage(error.message || "An error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-16 border-t border-gray-100 pt-10">
      <h2 className="text-2xl font-black text-primary mb-8 flex items-center gap-2">
        <MessageSquare size={24} />
        Customer Reviews
      </h2>

      <div className="bg-gray-50 p-6 rounded-3xl mb-10 border border-gray-100 shadow-sm">
        {isLoadingUser ? (
           <div className="text-center py-6 text-gray-500 font-medium animate-pulse">Checking session...</div>
        ) : !user ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-bold text-primary mb-2">Have you tried this product?</h3>
            <p className="text-gray-500 mb-6">Log in to share your experience and photos with the community.</p>
            <a href="/login" className="inline-block bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gray-900 transition-all shadow-md">
              Log In to Review
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-primary">Write a Review</h3>
            
            {/* RATING */}
            <div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                    <Star size={32} className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                  </button>
                ))}
              </div>
            </div>

            {/* TEXT CONTENT */}
            <div>
              <textarea
                required
                rows={4}
                className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-blue focus:outline-none resize-none font-medium text-primary placeholder:text-gray-400"
                placeholder="What did you love about it? Any tips for other buyers?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {/* MEDIA UPLOAD ZONE */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">Attach Photos or Video (Optional)</p>
              
              <div className="flex flex-wrap gap-4">
                {/* Upload Button */}
                {files.length < 3 && (
                  <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue hover:bg-blue-50 transition-colors cursor-pointer group">
                    <ImagePlus size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Add Media</span>
                    <input type="file" accept="image/*,video/mp4,video/quicktime" multiple className="hidden" onChange={handleFileSelect} />
                  </label>
                )}

                {/* Live Image Previews */}
                {previews.map((src, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm">
                      <X size={14} className="font-bold" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || !content.trim()} className="w-full sm:w-auto bg-brand-blue text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2">
              {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : "Post Review"}
            </button>

            {submitMessage && (
              <div className={`p-4 rounded-xl text-sm font-bold mt-2 ${submitMessage.includes("success") ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                {submitMessage}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Display Approved Reviews & Media */}
      <div className="space-y-8">
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic text-center py-10">No reviews yet. Be the first to share your thoughts!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                  ))}
                </div>
                <span className="text-xs text-gray-400 font-medium ml-2 border-l border-gray-200 pl-4">
                  {new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              
              <p className="text-primary leading-relaxed font-medium mb-4">{review.content}</p>
              
              {/* Render Approved Media Attachments */}
              {review.media && review.media.length > 0 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {review.media.map((url: string, i: number) => (
                    <div key={i} className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:opacity-90 cursor-pointer transition-opacity">
                       {url.match(/\.(mp4|mov|webm)$/i) ? (
                          <video src={url} className="w-full h-full object-cover" muted playsInline />
                       ) : (
                          <img src={url} alt="Review media" className="w-full h-full object-cover" />
                       )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}