import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default function BlogsPage() {
  // Temporary mock data until we connect the Supabase Admin table
  const mockBlogs = [
    { id: 1, title: "The Science of Temperature Retention", excerpt: "How our double-wall vacuum insulation keeps your coffee hot for 12 hours.", category: "Technology", date: "May 25, 2026", image: "/images/blog-1.jpg" },
    { id: 2, title: "Hydration Hacks for Peak Performance", excerpt: "Optimize your daily water intake with these simple, science-backed routines.", category: "Lifestyle", date: "May 20, 2026", image: "/images/blog-2.jpg" },
    { id: 3, title: "Designing the ThermoSmart", excerpt: "A look behind the scenes at the minimalist engineering of our flagship bottle.", category: "Design", date: "May 15, 2026", image: "/images/blog-3.jpg" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 pb-32">
      <div className="flex flex-col items-center text-center mb-16">
        <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <BookOpen size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter mb-4">Ferixo Journal</h1>
        <p className="text-lg text-gray-500 font-medium max-w-2xl">
          Insights on engineering, design, and optimizing your daily routine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockBlogs.map((blog) => (
          <Link key={blog.id} href={`/blogs/${blog.id}`} className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="aspect-[4/3] bg-canvas relative overflow-hidden">
               {/* Replace with actual image tag when DB is connected */}
               <div className="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform duration-500 flex items-center justify-center text-gray-400 font-bold text-sm">Image: {blog.image}</div>
               <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-black text-brand-blue uppercase tracking-wider">
                 {blog.category}
               </div>
            </div>
            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <p className="text-xs font-bold text-gray-400 mb-3">{blog.date}</p>
              <h2 className="text-xl font-black text-primary mb-3 line-clamp-2 group-hover:text-brand-blue transition-colors">{blog.title}</h2>
              <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6 line-clamp-3 flex-1">{blog.excerpt}</p>
              <div className="flex items-center gap-2 text-sm font-black text-brand-blue mt-auto">
                Read Article <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}