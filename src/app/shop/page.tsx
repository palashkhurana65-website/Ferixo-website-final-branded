import Link from "next/link";
import { Droplet, Coffee, Home, ArrowRight, Sparkles, LayoutGrid } from "lucide-react";

export default function ShopRootPage() {
  const categories = [
    { 
      name: "Bottles", 
      slug: "bottles", 
      icon: Droplet, 
      desc: "Premium insulated hydration.", 
      theme: "bg-blue-50 text-brand-blue",
      border: "hover:border-brand-blue"
    },
    { 
      name: "Tumblers", 
      slug: "tumblers", 
      icon: Sparkles, 
      desc: "Maximum temperature retention.", 
      theme: "bg-orange-50 text-brand-orange",
      border: "hover:border-brand-orange"
    },
    { 
      name: "Coffee Cups", 
      slug: "coffee-cups", 
      icon: Coffee, 
      desc: "Perfect for your daily brew.", 
      theme: "bg-amber-50 text-amber-600",
      border: "hover:border-amber-500"
    },
    { 
      name: "Home Living", 
      slug: "home-living", 
      icon: Home, 
      desc: "Elevate your everyday space.", 
      theme: "bg-gray-100 text-gray-700",
      border: "hover:border-gray-400"
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 pb-32">
      
      {/* HERO SECTION */}
      <div className="text-center max-w-2xl mx-auto mb-12 md:mb-20">
        <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tighter mb-4">
          Shop <span className="text-brand-blue">Ferixo.</span>
        </h1>
        <p className="text-gray-500 font-medium text-lg md:text-xl leading-relaxed">
          Select a category below to explore our engineered collections.
        </p>
      </div>

      {/* ALL PRODUCTS BANNER (Mobile-First Touch Target) */}
      <Link href="/shop/all" className="group block mb-6 md:mb-8">
        <div className="bg-primary rounded-3xl p-6 md:p-8 flex items-center justify-between transition-transform duration-300 hover:scale-[1.01] shadow-xl shadow-primary/10">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
              <LayoutGrid size={28} />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-black text-white tracking-tight">Shop All Products</h2>
              <p className="text-gray-400 font-medium text-sm md:text-base mt-1">View the entire catalog.</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform shadow-md">
            <ArrowRight size={20} className="font-bold" />
          </div>
        </div>
      </Link>

      {/* CATEGORY GRID (Stacked Mobile -> 2x2 Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        {categories.map((cat) => (
          <Link key={cat.slug} href={`/shop/${cat.slug}`} className="group block h-full">
            <div className={`bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg ${cat.border} flex flex-col h-full justify-between relative overflow-hidden`}>
              
              {/* Decorative Background Element */}
              <div className="absolute -right-8 -top-8 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <cat.icon size={200} />
              </div>

              <div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-sm ${cat.theme}`}>
                  <cat.icon size={28} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-primary tracking-tight mb-2">
                  {cat.name}
                </h3>
                <p className="text-gray-500 font-medium text-base md:text-lg">
                  {cat.desc}
                </p>
              </div>

              <div className="mt-8 flex items-center text-sm font-bold text-primary group-hover:text-brand-blue transition-colors">
                Explore Collection <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}