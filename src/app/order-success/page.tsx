import Link from "next/link";
import { CheckCircle2, ArrowRight, ShoppingBag } from "lucide-react";
import { createClient } from "../../lib/supabase/server";
import ProductCard from "../../components/storefront/ProductCard";

export default async function OrderSuccessPage() {
  const supabase = await createClient();
  
  // Fetch 3 random/latest products for the "Continue Shopping" section
  const { data: products } = await supabase
    .from('Product')
    .select('*, Image(url), Variant(*)')
    .limit(3)
    .order('createdAt', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 pb-32">
      
      {/* SUCCESS CONFIRMATION */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-20 slide-up-mobile">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 relative">
           <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
           <CheckCircle2 size={48} className="text-green-500 relative z-10" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter mb-4">
          Order Confirmed
        </h1>
        <p className="text-lg text-gray-500 font-medium leading-relaxed">
          Thank you for choosing Ferixo. We've sent a confirmation email with your order details. Your premium gear is being prepared for dispatch.
        </p>
        
        <div className="mt-10 flex gap-4">
          <Link href="/shop/all" className="bg-canvas border border-gray-200 text-primary px-8 py-4 rounded-2xl font-black hover:border-brand-blue transition-all active:scale-95 shadow-sm">
            View Catalog
          </Link>
        </div>
      </div>

      {/* CONTINUE SHOPPING LOOP */}
      <div className="border-t border-gray-100 pt-16">
        <div className="flex justify-between items-end mb-8">
           <div>
             <h2 className="text-2xl md:text-3xl font-black text-primary flex items-center gap-3">
               <ShoppingBag className="text-brand-blue" size={28} /> Continue Shopping
             </h2>
             <p className="text-gray-500 font-medium mt-2">Explore more from our engineered collections.</p>
           </div>
           <Link href="/shop/all" className="hidden md:flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-blue-700 transition-colors">
             View All <ArrowRight size={16} />
           </Link>
        </div>

        {products && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                category={product.category.toLowerCase().replace(/ /g, '-')} 
              />
            ))}
          </div>
        )}
        
        <Link href="/shop/all" className="md:hidden mt-8 w-full bg-canvas text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-gray-200">
           View Entire Catalog <ArrowRight size={18} />
        </Link>
      </div>

    </div>
  );
}