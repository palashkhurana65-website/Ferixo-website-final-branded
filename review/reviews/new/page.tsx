"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client"; // Adjust path if needed
import { ArrowLeft, Save, Star, ImagePlus, X, Loader2, Calendar } from "lucide-react";
import Link from "next/link";

export default function SeedReviewPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    productId: "",
    userId: "",
    rating: 5,
    content: "",
    status: "approved", // Default to approved for admin
    isFeatured: false,
    created_at: new Date().toISOString().slice(0, 16), // Local datetime-local format
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch Products and Profiles to populate the dropdowns
  // Fetch Products and Profiles to populate the dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, profilesRes] = await Promise.all([
          supabase.from("Product").select("id, name").order("name"),
          supabase.from("Profile").select("id, email, fullName").order("email")
        ]);

        // Safely set state only if data is not null
        if (productsRes.data) setProducts(productsRes.data);
        if (profilesRes.data) setProfiles(profilesRes.data);

        // Explicitly check for data before accessing arrays to satisfy TypeScript
        if (productsRes.data && productsRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, productId: productsRes.data[0].id }));
        }
        if (profilesRes.data && profilesRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, userId: profilesRes.data[0].id }));
        }
      } catch (err) {
        console.error("Failed to load reference data", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [supabase]);

  // Handle Media Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    setFiles((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!formData.productId || !formData.userId) {
      setError("Product and User must be selected.");
      setIsSubmitting(false);
      return;
    }

    try {
      const uploadedMediaUrls: string[] = [];

      // 1. Upload any attached media securely to the bucket
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const safeName = `${formData.productId}/admin-seeded-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('ferixo-ugc')
            .upload(safeName, file, { cacheControl: '3600', upsert: false });

          if (uploadError) throw new Error("Failed to upload media.");

          const { data: publicUrlData } = supabase.storage
            .from('ferixo-ugc')
            .getPublicUrl(safeName);

          uploadedMediaUrls.push(publicUrlData.publicUrl);
        }
      }

      // 2. Insert the final payload
      const { error: dbError } = await supabase
        .from("Review")
        .insert([{
          productId: formData.productId,
          userId: formData.userId,
          rating: formData.rating,
          content: formData.content,
          status: formData.status,
          isFeatured: formData.isFeatured,
          media: uploadedMediaUrls,
          created_at: new Date(formData.created_at).toISOString() // Parse local time back to UTC ISO
        }]);

      if (dbError) throw dbError;

      // 3. Redirect back to moderation dashboard on success
      router.push("/admin/reviews");
      router.refresh();

    } catch (err: any) {
      setError(err.message || "An error occurred while saving the review.");
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (loadingData) return <div className="p-20 text-center font-bold text-gray-400">Loading Configuration...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/reviews" className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
          <ArrowLeft size={20} className="text-primary" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-primary">Seed New Review</h1>
          <p className="text-gray-500 font-medium mt-1">Manually inject customer feedback into the database.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ROW 1: Product & User */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Target Product</label>
            <select 
              required
              className="w-full bg-canvas border border-gray-200 rounded-xl p-4 outline-none focus:border-brand-blue font-medium text-primary cursor-pointer"
              value={formData.productId}
              onChange={(e) => setFormData({...formData, productId: e.target.value})}
            >
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Reviewer (User Profile)</label>
            <select 
              required
              className="w-full bg-canvas border border-gray-200 rounded-xl p-4 outline-none focus:border-brand-blue font-medium text-primary cursor-pointer"
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName || 'No Name'} ({p.email})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-2">Must be linked to an existing registered user.</p>
          </div>
        </div>

        {/* ROW 2: Configuration (Status, Date, Featured) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Visibility Status</label>
            <select 
              className="w-full bg-canvas border border-gray-200 rounded-xl p-4 outline-none focus:border-brand-blue font-medium text-primary cursor-pointer"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="approved">Approved (Live)</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
             <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold flex items-center gap-1.5"><Calendar size={14}/> Backdate (Optional)</label>
             <input 
               type="datetime-local" 
               className="w-full bg-canvas border border-gray-200 rounded-xl p-4 outline-none focus:border-brand-blue font-medium text-primary cursor-pointer"
               value={formData.created_at}
               onChange={(e) => setFormData({...formData, created_at: e.target.value})}
             />
          </div>

          <div className="flex items-center justify-center pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 accent-yellow-500 rounded cursor-pointer" 
                checked={formData.isFeatured}
                onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
              />
              <span className="font-bold text-gray-700">Feature on Homepage Wall</span>
            </label>
          </div>
        </div>

        {/* ROW 3: Content & Rating */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Star Rating</label>
            <div className="flex gap-2 bg-canvas inline-flex p-2 rounded-xl border border-gray-200">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setFormData({...formData, rating: star})} className="focus:outline-none hover:scale-110 transition-transform">
                  <Star size={32} className={star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Review Text</label>
            <textarea
              required
              rows={5}
              className="w-full p-4 bg-canvas border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-blue focus:outline-none resize-none font-medium text-primary"
              placeholder="Enter the customer's review here..."
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>
          
          {/* MEDIA UPLOAD ZONE */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Inject Media (Optional)</label>
            <div className="flex flex-wrap gap-4">
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue hover:bg-blue-50 transition-colors cursor-pointer group bg-canvas">
                <ImagePlus size={24} className="mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Add File</span>
                <input type="file" accept="image/*,video/mp4,video/quicktime" multiple className="hidden" onChange={handleFileSelect} />
              </label>

              {previews.map((src, index) => (
                <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
                  {files[index].type.startsWith('video/') ? (
                    <video src={src} className="w-full h-full object-cover" />
                  ) : (
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button type="button" onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm">
                    <X size={14} className="font-bold" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-brand-blue text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <><Loader2 size={20} className="animate-spin"/> Injecting Data...</> : <><Save size={20}/> Save to Database</>}
          </button>
        </div>

      </form>
    </div>
  );
}