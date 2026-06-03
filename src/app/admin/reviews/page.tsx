"use client";

import { useState, useEffect } from "react";
import { Star, CheckCircle, XCircle, Trash2, Crown, Image as ImageIcon, Loader2, Edit } from "lucide-react";
import Link from "next/link";

export default function ReviewAdminPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews?admin=true', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleToggleFeature = async (id: string, currentFeatured: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFeatured: !currentFeatured }) });
      if (res.ok) setReviews(prev => prev.map(r => r.id === id ? { ...r, isFeatured: !currentFeatured } : r));
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this review forever?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        const errorData = await res.json();
        alert(`Deletion failed: ${errorData.error}`);
      }
    } catch (err) { 
      console.error(err); 
    }
    setActionLoading(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Review Control</h1>
          <p className="text-gray-500 mt-2">Manage customer feedback instantly.</p>
        </div>
        <Link href="/admin/reviews/new" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-sm">
          + Seed New Review
        </Link>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-bold flex flex-col items-center gap-3"><Loader2 className="animate-spin" size={32} /> Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-6 font-bold">Product & Author</th>
                <th className="p-6 font-bold">Rating & Content</th>
                <th className="p-6 font-bold text-center">Status</th>
                <th className="p-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reviews.map((review: any) => {
                 const authorName = review.Profile?.fullName || review.guestName || "Verified Customer";
                 return (
                  <tr key={review.id} className={`hover:bg-gray-50/50 transition-colors ${actionLoading === review.id ? 'opacity-50' : ''}`}>
                    <td className="p-6 align-top">
                      <p className="font-bold text-primary">{review.Product?.shortName || review.Product?.name || "Unknown Product"}</p>
                      <p className="text-xs text-brand-blue mt-1 font-bold">By: {authorName}</p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </td>
                    <td className="p-6 align-top max-w-md">
                      <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />)}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{review.content}</p>
                      {review.media && review.media.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-brand-blue px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100">
                          <ImageIcon size={14} /> {review.media.length} Media Attached
                        </div>
                      )}
                    </td>
                    <td className="p-6 align-top text-center">
                      <div className="flex flex-col gap-2 items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${review.status === 'approved' ? 'bg-green-100 text-green-700' : review.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {review.status.toUpperCase()}
                        </span>
                        {review.isFeatured && <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200"><Crown size={10} /> Featured</span>}
                      </div>
                    </td>
                    <td className="p-6 align-top text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/reviews/${review.id}`} className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors" title="Edit Review">
                          <Edit size={18} />
                        </Link>
                        <button onClick={() => handleToggleFeature(review.id, review.isFeatured)} className={`p-2 rounded-lg transition-colors ${review.isFeatured ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'}`} title="Feature"><Crown size={18} /></button>
                        <div className="w-px h-6 bg-gray-200 mx-1"></div>
                        <button onClick={() => handleUpdateStatus(review.id, 'approved')} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve"><CheckCircle size={18} /></button>
                        <button onClick={() => handleUpdateStatus(review.id, 'rejected')} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Reject"><XCircle size={18} /></button>
                        <button onClick={() => handleDelete(review.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}