import { createClient } from "../../../lib/supabase/server";
import ProductCard from "../../../components/storefront/ProductCard";
import Breadcrumbs from "../../../components/storefront/Breadcrumbs";
import ShopFilters from "../../../components/storefront/ShopFilters";
import Link from "next/link";
import type { Metadata } from "next";

// Helper to capitalize words (e.g., 'coffee-cups' -> 'Coffee Cups')
function formatCategoryName(slug: string) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cleanName = category === "all" ? "Entire Catalog" : formatCategoryName(category);

  return {
    title: `Shop ${cleanName}`,
    description: `Browse our premium selection of ${cleanName.toLowerCase()}. Engineered for minimalist aesthetics and peak thermal performance.`,
    alternates: {
      canonical: `/shop/${category}`,
    },
  };
}

export default async function ShopCategoryPage(props: { params: Promise<{ category: string }>, searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const category = params.category;
  const filterCapacity = searchParams.capacity;
  const filterColor = searchParams.color;
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : null;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : null;

  const supabase = await createClient();
  
  // Base Query
  let query = supabase.from('Product').select('*, Image(url), Variant(*)').order('createdAt', { ascending: false });
  
  if (category !== 'all') {
    const dbCategory = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    query = query.eq('category', dbCategory);
  }

  const { data: rawProducts } = await query;
  const safeProducts = rawProducts || [];

  // Calculate Global Price Boundaries for this category
  const allPrices = safeProducts.map(p => p.basePrice);
  const minBound = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const maxBound = allPrices.length > 0 ? Math.max(...allPrices) : 10000;

  // Post-process filtering for Variants & Pricing
  let products = safeProducts;
  if (filterCapacity || filterColor || minPrice !== null || maxPrice !== null) {
    products = products.filter(p => {
      const variants = p.Variant || [];
      const matchesCapacity = filterCapacity ? variants.some((v: any) => v.capacity === filterCapacity) : true;
      const matchesColor = filterColor ? variants.some((v: any) => v.colorName.toLowerCase() === filterColor.toLowerCase()) : true;
      const matchesMin = minPrice !== null ? p.basePrice >= minPrice : true;
      const matchesMax = maxPrice !== null ? p.basePrice <= maxPrice : true;
      
      return matchesCapacity && matchesColor && matchesMin && matchesMax;
    });
  }

  // Extract filters for the Sidebar UI
  const allCapacities = Array.from(new Set(safeProducts.flatMap(p => p.Variant?.map((v: any) => v.capacity).filter(Boolean))));
  const allColors = Array.from(new Set(safeProducts.flatMap(p => p.Variant?.map((v: any) => v.colorName).filter(Boolean))));
  const activeCategoryTitle = category === 'all' ? 'The Collection' : category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="mt-6 pt-2 pb-2 mb-4">
        <Breadcrumbs />
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 relative">
        
        {/* RESPONSIVE FILTER COMPONENT */}
        <ShopFilters 
          category={category} 
          allCapacities={allCapacities} 
          allColors={allColors}
          minBound={minBound}
          maxBound={maxBound}
        />

        {/* PRODUCT GRID */}
        <main className="flex-1">
          <div className="hidden md:block mb-8">
            <h1 className="text-4xl font-black text-primary tracking-tighter">{activeCategoryTitle}</h1>
            <p className="text-sm text-gray-500 font-bold mt-2">{products.length} Products Found</p>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-gray-200 rounded-3xl bg-white mt-4 md:mt-0">
              <h3 className="text-xl font-bold text-primary">No products match your filters.</h3>
              <Link href={`/shop/${category}`} className="text-brand-blue font-bold mt-4 inline-block hover:underline">Clear all filters</Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}