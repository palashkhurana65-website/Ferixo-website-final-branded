"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "../lib/supabase/client";

export default function ProductCategories() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('Product')
          .select('*, Image(url), Variant(*)')
          .order('createdAt', { ascending: false });
        
        if (error) {
          console.error("Supabase Error:", error.message);
        } else if (data) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products for home page.");
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [supabase]);

  const getProductsByCategory = (categoryName: string) => {
    return products
      .filter((p) => p.category?.toLowerCase() === categoryName.toLowerCase())
      .slice(0, 4); 
  };

  const sections = [
    { id: "bottles", title: "Insulated Bottles", link: "/shop/bottles", category: "bottles" },
    { id: "tumblers", title: "Travel Tumblers", link: "/shop/tumblers", category: "tumblers" },
    { id: "coffee-cups", title: "Coffee Cups", link: "/shop/coffee-cups", category: "coffee cups" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full space-y-20 md:space-y-32">
      {loading ? (
        <div className="text-center text-gray-400 font-bold animate-pulse py-20">
          Loading premium catalog...
        </div>
      ) : (
        sections.map((section) => {
          const categoryProducts = getProductsByCategory(section.category);
          
          if (categoryProducts.length === 0) return null;

          return (
            <div key={section.id} className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              <div className="flex justify-between items-end mb-8 md:mb-10 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight">{section.title}</h2>
                </div>
                <Link href={section.link} className="flex items-center gap-2 font-bold text-sm md:text-base text-brand-blue hover:text-blue-700 transition-colors">
                  View All <ArrowRight size={18} />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {categoryProducts.map((product) => {
                  const variants = product.Variant || [];
                  
                  const uniqueCapacities = Array.from(new Set(variants.map((v: any) => v.capacity).filter(Boolean)));
                  const capacityText = uniqueCapacities.length > 0 ? uniqueCapacities.join(", ") : "Premium";

                  const uniqueColors = variants.reduce((acc: any[], current: any) => {
                    const x = acc.find(item => item.colorCode === current.colorCode);
                    if (!x && current.colorCode) return acc.concat([current]);
                    return acc;
                  }, []);

                  const imageUrl = product.Image?.[0]?.url || "/placeholder.png";

                  return (
                    <Link key={product.id} href={`/shop/${product.category ? product.category.toLowerCase().replace(/\s+/g, '-') : 'all'}/${product.id}`} className="group flex flex-col gap-3 md:gap-4"> 
                      <div className="relative aspect-square w-full bg-canvas rounded-2xl border border-gray-100 overflow-hidden group-hover:border-brand-blue group-hover:shadow-md transition-all">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt={product.shortName || product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                      
                      <div className="px-1 mt-1">
                        <h3 className="text-sm md:text-base font-bold text-primary truncate">
                          {product.shortName || product.name}
                        </h3>
                        <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
                          {capacityText}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2.5">
                          <p className="text-sm md:text-base font-black text-brand-blue">
                            ₹{product.basePrice}
                          </p>
                          {uniqueColors.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              {uniqueColors.slice(0, 4).map((c: any, i: number) => (
                                <div key={i} title={c.colorName} className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full shadow-sm border border-gray-200/60" style={{ backgroundColor: c.colorCode }} />
                              ))}
                              {uniqueColors.length > 4 && (
                                <span className="text-[10px] text-gray-400 font-bold ml-0.5">+{uniqueColors.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}