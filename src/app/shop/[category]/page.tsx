import { createClient } from "../../../lib/supabase/server";
import ProductCard from "../../../components/storefront/ProductCard";
import Breadcrumbs from "../../../components/storefront/Breadcrumbs";
import Link from "next/link";
import { Filter } from "lucide-react";

export default async function ShopCategoryPage(props: { params: Promise<{ category: string }>, searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const category = params.category;
  const filterCapacity = searchParams.capacity;
  const filterColor = searchParams.color;

  const supabase = await createClient();
  
  // Base Query
  let query = supabase.from('Product').select('*, Image(url), Variant(*)').order('createdAt', { ascending: false });
  
  // Category Filter
  if (category !== 'all') {
    // Convert url slug 'coffee-cups' back to database format 'Coffee Cups'
    const dbCategory = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    query = query.eq('category', dbCategory);
  }

  const { data: rawProducts } = await query;

  // Post-process filtering for deeply nested Variants
  let products = rawProducts || [];
  if (filterCapacity || filterColor) {
    products = products.filter(p => {
      const variants = p.Variant || [];
      const matchesCapacity = filterCapacity ? variants.some((v: any) => v.capacity === filterCapacity) : true;
      const matchesColor = filterColor ? variants.some((v: any) => v.colorName.toLowerCase() === filterColor.toLowerCase()) : true;
      return matchesCapacity && matchesColor;
    });
  }

  // Extract filters for the Sidebar
  const allCapacities = Array.from(new Set(rawProducts?.flatMap(p => p.Variant?.map((v: any) => v.capacity)) || []));
  const allColors = Array.from(new Set(rawProducts?.flatMap(p => p.Variant?.map((v: any) => v.colorName)) || []));
  const activeCategoryTitle = category === 'all' ? 'All Products' : category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <Breadcrumbs />
      
      <div className="flex flex-col md:flex-row gap-8 mt-4">
        
        {/* RESPONSIVE FILTER SIDEBAR */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-primary" />
              <h2 className="text-lg font-black text-primary tracking-tight">Filters</h2>
            </div>

            {/* Mobile-friendly horizontal scroll, Desktop vertical stack */}
            <div className="flex md:flex-col gap-6 overflow-x-auto md:overflow-visible no-scrollbar pb-4 md:pb-0">
              
              {/* Capacities */}
              <div className="min-w-[150px]">
                <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Capacity</h3>
                <div className="flex md:flex-col gap-2">
                  <Link href={`/shop/${category}${filterColor ? `?color=${filterColor}` : ''}`} className={`text-sm font-bold px-3 py-2 md:p-0 rounded-lg md:rounded-none ${!filterCapacity ? 'text-brand-blue bg-blue-50 md:bg-transparent' : 'text-gray-500 hover:text-primary'}`}>All Sizes</Link>
                  {allCapacities.map(cap => (
                    <Link key={cap} href={`/shop/${category}?capacity=${cap}${filterColor ? `&color=${filterColor}` : ''}`} className={`text-sm font-bold whitespace-nowrap px-3 py-2 md:p-0 rounded-lg md:rounded-none ${filterCapacity === cap ? 'text-brand-blue bg-blue-50 md:bg-transparent' : 'text-gray-500 hover:text-primary'}`}>
                      {cap}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="min-w-[150px]">
                <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Colors</h3>
                <div className="flex md:flex-col gap-2">
                  <Link href={`/shop/${category}${filterCapacity ? `?capacity=${filterCapacity}` : ''}`} className={`text-sm font-bold px-3 py-2 md:p-0 rounded-lg md:rounded-none ${!filterColor ? 'text-brand-blue bg-blue-50 md:bg-transparent' : 'text-gray-500 hover:text-primary'}`}>All Colors</Link>
                  {allColors.map(color => (
                    <Link key={color} href={`/shop/${category}?color=${color}${filterCapacity ? `&capacity=${filterCapacity}` : ''}`} className={`text-sm font-bold whitespace-nowrap px-3 py-2 md:p-0 rounded-lg md:rounded-none ${filterColor === color ? 'text-brand-blue bg-blue-50 md:bg-transparent' : 'text-gray-500 hover:text-primary'}`}>
                      {color}
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </aside>

        {/* PRODUCT GRID */}
        <main className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tighter">{activeCategoryTitle}</h1>
            <p className="text-sm text-gray-500 font-bold mt-2">{products.length} Products Found</p>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} category={category} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-gray-200 rounded-3xl bg-white">
              <h3 className="text-xl font-bold text-primary">No products match your filters.</h3>
              <Link href={`/shop/${category}`} className="text-brand-blue font-bold mt-4 inline-block hover:underline">Clear all filters</Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}