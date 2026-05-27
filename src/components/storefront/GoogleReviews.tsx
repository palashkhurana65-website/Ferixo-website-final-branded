"use client";

import { Star, CheckCircle2 } from "lucide-react";

export default function GoogleReviews() {
  // Curated list of top reviews. You can easily edit these or fetch them from Supabase later.
  const reviews = [
    {
      id: 1,
      author: "Rahul Sharma",
      date: "1 week ago",
      content: "Absolutely premium quality. The matte black finish on the tumbler is flawless and it keeps my coffee hot for hours.",
      rating: 5,
    },
    {
      id: 2,
      author: "Priya Patel",
      date: "2 weeks ago",
      content: "The makeup organizer completely transformed my vanity. The build quality feels incredibly solid and luxurious.",
      rating: 5,
    },
    {
      id: 3,
      author: "Vikram S.",
      date: "1 month ago",
      content: "Fast delivery and the packaging was top-notch. You can tell Ferixo cares about the unboxing experience.",
      rating: 5,
    },
    {
      id: 4,
      author: "Ananya Desai",
      date: "1 month ago",
      content: "Bought the creator accessories for my desk setup. Minimalist, functional, and exactly what I was looking for.",
      rating: 5,
    }
  ];

  return (
    <section className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tighter flex items-center gap-3">
            Real Customer Reviews
          </h2>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xl font-black text-primary">5.0</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={20} className="fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-400 ml-2">Based on Google Reviews</span>
          </div>
        </div>
      </div>

      {/* HORIZONTAL SCROLLING REVIEW CARDS */}
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 snap-x no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none]">
        {reviews.map((review) => (
          <div 
            key={review.id} 
            className="min-w-[280px] md:min-w-[340px] max-w-[340px] bg-canvas border border-gray-100 p-6 md:p-8 rounded-3xl snap-center flex flex-col justify-between"
          >
            <div>
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 font-medium leading-relaxed mb-6 text-sm md:text-base">
                "{review.content}"
              </p>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
              <div>
                <p className="text-sm font-bold text-primary">{review.author}</p>
                <p className="text-xs font-medium text-gray-400 mt-0.5">{review.date}</p>
              </div>
              
              {/* Fake Google "G" Icon / Verified Badge */}
              <div className="flex items-center gap-1.5 bg-blue-50 text-brand-blue px-2.5 py-1 rounded-full">
                <CheckCircle2 size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}