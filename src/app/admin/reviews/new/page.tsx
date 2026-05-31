"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import { ArrowLeft, Save, Star, ImagePlus, X, Loader2, Calendar } from "lucide-react";
import Link from "next/link";

export default function SeedReviewPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    productId: "", guestName: "", rating: 5, content: "", status: "approved", isFeatured: false, created_at: new Date().toISOString().slice(0, 16),
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: productsData } = await supabase.from("Product").select("id, name");
        if (productsData) setProducts(productsData);
        if (productsData && productsData.length > 0) setFormData(prev => ({ ...prev, productId: productsData[0].id }));
      } catch (err) { console.error(err); } finally { setLoadingData(false); }
    };
    fetchData();
  }, [supabase]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    setPreviews(prev => [...prev, ...selectedFiles.map(file => URL.createObjectURL(file))]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const uploadedMediaUrls: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const safeName = `${formData.productId}/admin-seeded-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('ferixo-ugc').upload(safeName, file, { cacheControl: '3600', upsert: false });
          if (uploadError) throw new Error("Failed to upload media.");
          const { data: publicUrlData } = supabase.storage.from('ferixo-ugc').getPublicUrl(safeName);
          uploadedMediaUrls.push(publicUrlData.publicUrl);
        }
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId,
          guestName: formData.guestName || "Seeded Customer",
          rating: formData.rating,
          content: formData.content,
          media: uploadedMediaUrls,
          status: formData.status,
          isFeatured: formData.isFeatured
        })
      });

      if (!res.ok) throw new Error("Database insertion failed");

      // Allows manual backdating of timestamps natively through the action API patch if necessary, 
      // but standard API handles insertion safely.
      router.push("/admin/reviews");
      router.refresh();

    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (loadingData) return <div className="p-20 text-center font-bold text-gray-400">Loading Configuration...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/reviews" className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"><ArrowLeft size={20} className="text-primary" /></Link>
        <div><h1 className="text-3xl font-black text-primary">Seed New Review</h1><p className="text-gray-500 font-medium mt-1">Inject anonymous or historic feedback.</p></div>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">Target Product</label>
            <select required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 outline-none font-medium text-primary" value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})}>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">Customer Name</label>
            <input type="text" required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 outline-none font-medium text-primary" placeholder="Enter name..." value={formData.guestName} onChange={(e) => setFormData({...formData, guestName: e.target.value})} />
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">Star Rating</label>
            <div className="flex gap-2 bg-canvas inline-flex p-2 rounded-xl border border-gray-200">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setFormData({...formData, rating: star})} className="focus:outline-none hover:scale-110">
                  <Star size={32} className={star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                </button>
              ))}
            </div>
          </div>
          <div><label className="block text-xs font-bold text-gray-500 mb-2">Review Text</label><textarea required rows={5} className="w-full p-4 bg-canvas border border-gray-200 rounded-2xl outline-none resize-none font-medium text-primary" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} /></div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">Inject Media</label>
            <div className="flex flex-wrap gap-4">
              <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 cursor-pointer bg-canvas"><ImagePlus size={24} className="mb-1"/><input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} /></label>
              {previews.map((src, index) => (
                <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
                  {files[index].type.startsWith('video/') ? <video src={src} className="w-full h-full object-cover" /> : <img src={src} className="w-full h-full object-cover" />}
                  <button type="button" onClick={() => removeFile(index)} className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full"><X size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="bg-brand-blue text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 shadow-md">{isSubmitting ? "Injecting..." : "Save Data"}</button></div>
      </form>
    </div>
  );
}