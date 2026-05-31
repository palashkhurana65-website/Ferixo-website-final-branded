import { createClient } from "@supabase/supabase-js";
import { Star, Quote, CheckCircle2, Play } from "lucide-react";
import Link from "next/link";

// Force Next.js to fetch fresh data so new featured reviews appear quickly
export const revalidate = 60; 

export default async function ReviewCarousel() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch only reviews that you have explicitly "Featured" (crowned) in the admin panel
  const { data: reviews, error } = await supabase
    .from("Review")
    .select(`
      *,
      Product ( name, shortName ),
      Profile ( fullName )
    `)
    .eq("status", "approved")
    .eq("isFeatured", true) 
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Homepage Carousel Error:", error);
    return null;
  }

  // Hide the section completely if you haven't featured any reviews yet
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="py-24 bg-gray-50 overflow-hidden border-t border-gray-100">
      {/* FIX: Set a single, unified max-width container matching your other sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* FIX: Removed the conflicting mx-auto and max-w classes from this header row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h2 className="text-4xl font-black text-primary tracking-tight mb-4">
              Loved by Thousands
            </h2>
            <p className="text-lg text-gray-500 font-medium">
              Real experiences from our verified community.
            </p>
          </div>
          <Link href="/reviews" className="hidden md:block text-brand-blue font-bold hover:text-blue-700 transition-colors shrink-0 pb-1">
            Read All Reviews &rarr;
          </Link>
        </div>

        {/* Swipeable Carousel Track */}
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {reviews.map((review: any) => {
            const authorName = review.Profile?.fullName || review.guestName || "Verified Customer";

            return (
              <div 
                key={review.id} 
                className="w-[350px] md:w-[450px] flex-shrink-0 snap-start bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow relative"
              >
                <Quote className="absolute top-6 right-6 text-gray-50" size={40} />
                
                {/* Author Header */}
                <div className="flex items-center gap-3 mb-5 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-blue font-black uppercase text-lg">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-primary text-large leading-tight capitalize">
                        {authorName}
                      </p>
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                        <CheckCircle2 size={10} strokeWidth={3} /> Verified
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">
                      Published {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-5 relative z-10">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={18} 
                      className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} 
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-800 leading-relaxed font-medium mb-6 relative z-10 flex-grow text-[15px]">
                  "{review.content}"
                </p>

                {/* Media Thumbnail */}
                {review.media && review.media.length > 0 && (
                  <div className="mb-6 relative z-10 w-24 h-24 rounded-2xl overflow-hidden border border-gray-100">
                     {review.media[0].match(/\.(mp4|mov|webm)$/i) ? (
                       <>
                         <video src={review.media[0]} className="w-full h-full object-cover" muted playsInline />
                         <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                           <div className="bg-white/90 p-1.5 rounded-full"><Play size={14} className="text-primary fill-primary ml-0.5" /></div>
                         </div>
                       </>
                     ) : (
                       <img src={review.media[0]} className="w-full h-full object-cover" alt="Customer photo" />
                     )}
                  </div>
                )}

                {/* Product Mention Footer */}
                <div className="border-t border-gray-50 pt-5 relative z-10 mt-auto">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                    Item Purchased
                  </p>
                  <Link 
                    href={`/shop/${review.productId}`} 
                    className="block text-sm font-black text-brand-blue hover:text-blue-700 transition-colors"
                  >
                    {review.Product?.shortName || review.Product?.name || "Premium Item"}
                  </Link>
                </div>
              </div>
            );
          })}
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