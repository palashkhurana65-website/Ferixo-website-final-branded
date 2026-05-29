import { getAdminReviews } from "../../actions/reviewAdmin";
import { Star, CheckCircle, XCircle, Trash2, Edit } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Review Moderation | Admin",
};

export default async function ReviewAdminPage() {
  // Fetch all reviews securely on the server
  const reviews = await getAdminReviews();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Review Moderation</h1>
          <p className="text-gray-500 mt-2">Approve, reject, edit, or inject customer feedback.</p>
        </div>
        {/* We link to a dedicated page if you want to manually inject/seed reviews */}
        <Link 
          href="/admin/reviews/new" 
          className="bg-primary text-canvas px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors"
        >
          + Seed New Review
        </Link>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm uppercase tracking-wider text-gray-500">
              <th className="p-6 font-bold">Product</th>
              <th className="p-6 font-bold">Rating & Content</th>
              <th className="p-6 font-bold">Status</th>
              <th className="p-6 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reviews?.map((review: any) => (
              <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-6 align-top">
                  <p className="font-bold text-primary">{review.Product?.name || "Unknown Product"}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(review.created_at).toLocaleDateString('en-IN')}
                  </p>
                </td>
                
                <td className="p-6 align-top max-w-md">
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 truncate" title={review.content}>
                    {review.content}
                  </p>
                </td>

                <td className="p-6 align-top">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    review.status === 'approved' ? 'bg-green-100 text-green-700' : 
                    review.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {review.status.toUpperCase()}
                  </span>
                </td>

                <td className="p-6 align-top text-right">
                  <div className="flex items-center justify-end gap-3">
                    {/* These would be wired up to small client-side forms/buttons calling your server actions */}
                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors" title="Approve">
                      <CheckCircle size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-yellow-600 transition-colors" title="Reject">
                      <XCircle size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!reviews || reviews.length === 0) && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-400 font-medium">
                  No reviews found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}