import { createClient } from "@supabase/supabase-js";
import { Star, Quote } from "lucide-react";
import Link from "next/link";

// Force Next.js to cache this section and only check for new reviews once per hour
export const revalidate = 3600; 

export default async function FeaturedReviews() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch top 6 approved, 5-star reviews to ensure maximum conversion leverage
  const { data: reviews, error } = await supabase
    .from("Review")
    .select(`
      id,
      rating,
      content,
      created_at,
      productId,
      Product ( name )
    `)
    .eq("status", "approved")
    .eq("rating", 5)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Featured Reviews Error:", error);
    return null;
  }

  // If the database is empty or has no 5-star reviews yet, hide the section gracefully
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-primary tracking-tight mb-4">
            Loved by Thousands
          </h2>
          <p className="text-lg text-gray-500">
            Don't just take our word for it. Here is what our customers are saying.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review: any) => (
            <div 
              key={review.id} 
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow"
            >
              <Quote className="text-blue-100 mb-4" size={40} />
              
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={20} 
                    className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} 
                  />
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed mb-6 flex-grow">
                "{review.content}"
              </p>

              <div className="border-t border-gray-50 pt-4 mt-auto">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                  Verified Purchase
                </p>
                {/* Links directly to the product to drive sales */}
                <Link 
                  href={`/products/${review.productId}`} 
                  className="text-sm font-bold text-primary hover:text-blue-600 transition-colors"
                >
                  {review.Product?.name || "Premium Product"}
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}