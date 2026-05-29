"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Star, MessageSquare } from "lucide-react";

export default function ProductReviews({ productId }: { productId: string }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    // 1. Check if the user is logged in via Google
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    // 2. Fetch only APPROVED reviews for this specific product
    const fetchReviews = async () => {
      const { data } = await supabase
        .from("Review")
        .select("*")
        .eq("productId", productId)
        .eq("status", "approved") // RLS also enforces this, but good to be explicit
        .order("created_at", { ascending: false });
        
      if (data) setReviews(data);
    };

    getUser();
    fetchReviews();
  }, [productId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setSubmitMessage("");

    // Insert the review. The database defaults status to 'pending' automatically.
    const { error } = await supabase
      .from("Review")
      .insert([
        {
          productId: productId,
          userId: user.id,
          rating: rating,
          content: content,
        }
      ]);

    setIsSubmitting(false);

    if (error) {
      setSubmitMessage("Failed to submit review. Please try again.");
    } else {
      setSubmitMessage("Review submitted successfully! It will appear once approved.");
      setContent("");
      setRating(5);
    }
  };

  return (
    <div className="mt-16 border-t border-gray-100 pt-10">
      <h2 className="text-2xl font-black text-primary mb-8 flex items-center gap-2">
        <MessageSquare size={24} />
        Customer Reviews
      </h2>

      {/* Review Submission Form (Strictly isolated to logged-in users) */}
      <div className="bg-gray-50 p-6 rounded-2xl mb-10">
        {!user ? (
          <div className="text-center py-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Want to leave a review?</h3>
            <p className="text-gray-500 mb-4">You must be logged in to share your experience.</p>
            {/* Link this to your Google Login page/button */}
            <a href="/login" className="bg-primary text-canvas px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors">
              Log In with Google
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Write a Review</h3>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      size={28} 
                      className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Your Review</label>
              <textarea
                required
                rows={4}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="What did you think about this product?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="bg-primary text-canvas px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Post Review"}
            </button>

            {submitMessage && (
              <p className={`text-sm font-bold mt-2 ${submitMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
                {submitMessage}
              </p>
            )}
          </form>
        )}
      </div>

      {/* Display Approved Reviews */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-gray-500 italic">No reviews yet. Be the first to share your thoughts!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} 
                  />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">{review.content}</p>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                {new Date(review.created_at).toLocaleDateString('en-IN')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}