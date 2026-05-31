import { createClient } from "@supabase/supabase-js";
import { Star, Quote, CheckCircle2 } from "lucide-react";
import Link from "next/link";

// Force Next.js to cache this section and only check for new reviews once per hour
export const revalidate = 3600; 

export default async function ReviewCarousel() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch only the hand-picked featured reviews, and grab the Product name
  const { data: reviews, error } = await supabase
    .from("Review")
    .select(`
      id,
      rating,
      content,
      created_at,
      productId,
      media,
      Product ( name )
    `)
    .eq("status", "approved")
    .eq("isFeatured", true) // Only pulls reviews you crowned in the admin panel!
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Homepage Carousel Error:", error);
    return null;
  }

  // If you haven't featured any reviews yet, hide the section gracefully
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="py-24 bg-canvas overflow-hidden border-t border-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-end mb-12 max-w-7xl mx-auto">
          <div>
            <h2 className="text-4xl font-black text-primary tracking-tight mb-4">
              Loved by Thousands
            </h2>
            <p className="text-lg text-gray-500 font-medium">
              Real experiences from our verified community.
            </p>
          </div>
          <Link href="/reviews" className="hidden md:block text-brand-blue font-bold hover:text-blue-700 transition-colors">
            Read All Reviews &rarr;
          </Link>
        </div>

        {/* CSS Snap Scrolling Carousel */}
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {reviews.map((review: any) => (
            <div 
              key={review.id} 
              className="w-[350px] md:w-[450px] flex-shrink-0 snap-start bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow relative"
            >
              <Quote className="absolute top-6 right-6 text-gray-50" size={40} />
              
              <div className="flex gap-1 mb-6 relative z-10">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={20} 
                    className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} 
                  />
                ))}
              </div>

              <p className="text-gray-800 leading-relaxed font-medium mb-8 relative z-10 flex-grow text-[16px]">
                "{review.content}"
              </p>

              {/* Display a single media thumbnail if they uploaded photos */}
              {review.media && review.media.length > 0 && (
                <div className="mb-6 relative z-10 w-24 h-24 rounded-2xl overflow-hidden border border-gray-100">
                   {review.media[0].match(/\.(mp4|mov|webm)$/i) ? (
                     <video src={review.media[0]} className="w-full h-full object-cover" muted playsInline />
                   ) : (
                     <img src={review.media[0]} className="w-full h-full object-cover" alt="Customer photo" />
                   )}
                </div>
              )}

              <div className="border-t border-gray-50 pt-5 relative z-10">
                <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold uppercase tracking-wider mb-2">
                  <CheckCircle2 size={14} /> Verified Buyer
                </div>
                {/* The crucial product mention and link */}
                <p className="text-sm text-gray-500 font-medium">
                  Purchased:{" "}
                  <Link 
                    href={`/shop/${review.productId}`} 
                    className="font-bold text-brand-blue hover:text-blue-700 transition-colors"
                  >
                    {review.Product?.name || "Premium Item"}
                  </Link>
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
           <Link href="/reviews" className="text-brand-blue font-bold hover:text-blue-700 transition-colors inline-block border border-blue-100 bg-blue-50 px-6 py-3 rounded-full">
              Read All Reviews
           </Link>
        </div>

      </div>
    </section>
  );
}