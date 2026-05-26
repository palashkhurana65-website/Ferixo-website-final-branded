export const dynamic = 'force-dynamic'; // Ensures live data on refresh

import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { Plus, Search, Filter } from "lucide-react";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams.category || "All";

  // Build Query
  let query = supabase.from('Product').select('*, Image(url)').order('createdAt', { ascending: false });
  if (currentCategory !== "All") {
    query = query.eq('category', currentCategory);
  }

  const { data: products } = await query;

  const categories = ["All", "Bottles", "Tumblers", "Coffee Cups", "Home Living"];

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Inventory</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage your catalog and stock.</p>
        </div>
        <Link href="/admin/products/new" className="w-full md:w-auto bg-brand-blue text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95">
          <Plus size={20} /> Add Product
        </Link>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex gap-2 p-1">
          {categories.map(cat => (
            <Link 
              key={cat} 
              href={`/admin/products${cat === "All" ? "" : `?category=${cat}`}`}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${currentCategory === cat ? "bg-primary text-white" : "text-gray-500 hover:bg-canvas"}`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* PRODUCT GRID */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/admin/products/${product.id}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-brand-blue hover:shadow-lg transition-all group">
              <div className="aspect-square bg-canvas relative overflow-hidden">
                {product.Image && product.Image[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.Image[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-primary shadow-sm">
                  {product.category}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-primary truncate text-lg">{product.name}</h3>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-gray-500 font-bold text-sm">₹{product.basePrice}</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-lg ${product.stock > 10 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-brand-orange'}`}>
                    {product.stock} in stock
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
           <Filter size={40} className="mx-auto text-gray-300 mb-4" />
           <h3 className="text-xl font-bold text-primary">No Products Found</h3>
           <p className="text-gray-500 text-sm mt-2">Adjust your filters or add a new product.</p>
        </div>
      )}
    </div>
  );
}