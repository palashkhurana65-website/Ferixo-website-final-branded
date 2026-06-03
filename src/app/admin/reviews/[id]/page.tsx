"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Star, MessageSquare, Trash2, Image as ImageIcon, ImagePlus, X } from "lucide-react";
import { createClient } from "../../../../lib/supabase/client"; 

export default function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const reviewId = unwrappedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    guestName: "",
    rating: 5,
    content: "",
    status: "pending",
    isFeatured: false,
    productId: "", 
    productName: "",
    media: [] as string[] // Existing live URLs
  });

  // 🚀 NEW: State for new file uploads
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // 🚀 NEW: File Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    setPreviews(prev => [...prev, ...selectedFiles.map(file => URL.createObjectURL(file))]);
  };

  const removeNewFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index: number) => {
    const newMedia = [...formData.media];
    newMedia.splice(index, 1);
    setFormData({ ...formData, media: newMedia });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🚀 NEW: Initialize Supabase client
        const supabase = createClient();
        
        // 1. Fetch Products directly via Supabase (Matching your Seeder logic)
        const { data: productsData, error: productError } = await supabase
          .from("Product")
          .select("id, name, shortName");
          
        if (productsData) {
          setProducts(productsData);
        } else if (productError) {
          console.error("Failed to fetch products:", productError);
        }

        // 2. Fetch the Reviews
        const reviewsRes = await fetch(`/api/reviews?admin=true`);
        if (!reviewsRes.ok) throw new Error("Failed to fetch reviews");
        
        const allReviews = await reviewsRes.json();
        
        // Find the specific review
        const review = allReviews.find((r: any) => r.id === reviewId);
        if (!review) throw new Error("Review not found");

        setFormData({
          guestName: review.Profile?.fullName || review.guestName || "Verified Customer",
          rating: review.rating || 5,
          content: review.content || "",
          status: review.status || "pending",
          isFeatured: review.isFeatured || false,
          productId: review.productId || "",
          productName: review.Product?.shortName || review.Product?.name || "Unknown Product", 
          media: review.media || [] 
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reviewId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const uploadedMediaUrls: string[] = [];

      // 1. 🚀 Upload any NEW files to the bucket
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const safeName = `${formData.productId}/admin-edit-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage.from('ferixo-ugc').upload(safeName, file, { cacheControl: '3600', upsert: false });
          if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);
          
          const { data: publicUrlData } = supabase.storage.from('ferixo-ugc').getPublicUrl(safeName);
          uploadedMediaUrls.push(publicUrlData.publicUrl);
        }
      }

      // 2. Combine kept old URLs with the newly uploaded URLs
      const finalMediaArray = [
        ...formData.media.filter(url => url.trim() !== ""),
        ...uploadedMediaUrls
      ];

      // 3. Update the database record
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: formData.guestName,
          rating: formData.rating,
          content: formData.content,
          status: formData.status,
          isFeatured: formData.isFeatured,
          productId: formData.productId,
          media: finalMediaArray // 🚀 Sending combined media
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update review");
      }

      router.push("/admin/reviews");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brand-blue font-bold gap-3">
        <Loader2 className="animate-spin" size={24} /> Loading Editor...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/reviews" className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft size={20} className="text-primary" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight">Edit Review</h1>
            <p className="text-gray-500 font-medium text-sm mt-1">For: <span className="text-brand-blue">{formData.productName}</span></p>
          </div>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full md:w-auto bg-brand-blue text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold text-sm mb-6 border border-red-100">
          Error: {error}
        </div>
      )}

      {/* EDITOR FORM */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 🚀 NEW: PRODUCT RE-ASSIGNMENT */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Assigned Product</label>
              <select
                className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary focus:border-brand-blue outline-none font-bold cursor-pointer"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              >
                <option value="" disabled>Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.shortName || p.name}</option>
                ))}
              </select>
            </div>

            {/* AUTHOR NAME */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Customer Name</label>
              <input 
                type="text" 
                className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary focus:border-brand-blue outline-none font-medium"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
              />
            </div>

            {/* STATUS OVERRIDE */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Visibility Status</label>
              <select 
                className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary focus:border-brand-blue outline-none font-bold cursor-pointer"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">Pending Review</option>
                <option value="approved">Approved (Live)</option>
                <option value="rejected">Rejected (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            {/* RATING SELECTOR */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-3 font-bold">Star Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`p-3 rounded-xl transition-all border-2 flex items-center justify-center ${formData.rating >= star ? 'border-yellow-400 bg-yellow-50 text-yellow-500' : 'border-gray-200 bg-canvas text-gray-300 hover:border-yellow-200'}`}
                  >
                    <Star size={24} className={formData.rating >= star ? "fill-yellow-400" : ""} />
                  </button>
                ))}
              </div>
            </div>

            {/* FEATURED TOGGLE */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-3 font-bold">Featured Status</label>
              <button
                onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                className={`w-full p-4 rounded-xl border-2 transition-all font-bold text-left flex items-center justify-between ${formData.isFeatured ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-200 bg-canvas text-gray-500 hover:bg-gray-50'}`}
              >
                Display on Hero Sections
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isFeatured ? 'bg-brand-blue' : 'bg-gray-300'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${formData.isFeatured ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </button>
            </div>
          </div>

          {/* CONTENT EDIT */}
          <div className="pt-4 border-t border-gray-100">
            <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold flex items-center gap-2">
              <MessageSquare size={16} /> Review Content
            </label>
            <textarea 
              rows={6}
              className="w-full bg-canvas border border-gray-200 rounded-xl p-5 text-primary focus:border-brand-blue outline-none font-medium resize-none text-lg leading-relaxed"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* 🚀 NEW: VISUAL MEDIA EDITOR */}
          <div className="pt-8 border-t border-gray-100">
            <label className="text-xs uppercase tracking-wider text-gray-500 mb-4 font-bold flex items-center gap-2">
              <ImageIcon size={16} /> Attached Media
            </label>
            
            <div className="flex flex-wrap gap-4">
              {/* Existing Uploaded Images */}
              {formData.media.map((src, index) => (
                <div key={`existing-${index}`} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Existing review media" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button type="button" onClick={() => removeExistingMedia(index)} className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform">
                       <Trash2 size={16} />
                     </button>
                  </div>
                </div>
              ))}

              {/* New File Previews */}
              {previews.map((src, index) => (
                <div key={`new-${index}`} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-brand-blue shadow-sm group">
                  <div className="absolute top-0 left-0 bg-brand-blue text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">NEW</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="New media preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNewFile(index)} className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full shadow-sm hover:scale-110">
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* Upload Button */}
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 hover:border-brand-blue hover:text-brand-blue rounded-2xl flex flex-col items-center justify-center text-gray-400 cursor-pointer bg-canvas transition-colors">
                <ImagePlus size={24} className="mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Add File</span>
                <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
              </label>
            </div>
            <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-wider">Note: Videos and Images will be uploaded to Ferixo-UGC upon saving.</p>
          </div>

        </div>
      </div>
    </div>
  );
}