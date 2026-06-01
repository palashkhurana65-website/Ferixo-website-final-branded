"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "../../../../lib/supabase/client";
import Breadcrumbs from "../../../../components/storefront/Breadcrumbs";
import ProductCard from "../../../../components/storefront/ProductCard";
import { Minus, Plus, ShoppingBag, CheckCircle2, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCartStore } from "../../../../lib/store";
import Link from "next/link";
import { sendGAEvent } from '@next/third-parties/google';
import GoogleReviews from "../../../../components/storefront/GoogleReviews";
import ProductReviews from "../../../../components/storefront/ProductReviews";

export default function ProductDetailClient({ params }: { params: Promise<{ category: string, id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const unwrappedParams = use(params);
  const supabase = createClient();
  const addItem = useCartStore((state) => state.addItem);
  
  const [product, setProduct] = useState<any>(null);
  const [relevantProducts, setRelevantProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showCartPopup, setShowCartPopup] = useState(false);

  // Variant States
  const [selectedCapacity, setSelectedCapacity] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  
  // Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Main Product
      const { data: prodData } = await supabase.from('Product').select('*, Image(url), Feature(text), Variant(*)').eq('id', unwrappedParams.id).single();
      
      if (prodData) {
        setProduct(prodData);
        if (prodData.Variant && prodData.Variant.length > 0) {
          const variantQuery = searchParams.get('variant');
          
          let matchedVariant = null;
          if (variantQuery) {
            // Check if the URL parameter matches a real variant (e.g. "matte-black-1000ml")
            matchedVariant = prodData.Variant.find((v: any) => 
              `${v.colorName}-${v.capacity}`.toLowerCase().replace(/\s+/g, '-') === variantQuery
            );
          }

          if (matchedVariant) {
            setSelectedCapacity(matchedVariant.capacity);
            setSelectedColor(matchedVariant.colorName);
          } else {
            // Default load (or invalid URL parameter): Set first variant and update URL silently
            const firstCapacity = prodData.Variant[0].capacity;
            setSelectedCapacity(firstCapacity);
            const colorsForFirstCap = prodData.Variant.filter((v: any) => v.capacity === firstCapacity);
            if (colorsForFirstCap.length > 0) {
              const firstColor = colorsForFirstCap[0].colorName;
              setSelectedColor(firstColor);
              
              const params = new URLSearchParams(window.location.search);
              params.set('variant', `${firstColor}-${firstCapacity}`.toLowerCase().replace(/\s+/g, '-'));
              router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
            }
          }
        }

        // 2. Fetch Relevant Products (Cross-category)
        const { data: relatedData } = await supabase.from('Product')
          .select('*, Image(url), Variant(*)')
          .neq('id', unwrappedParams.id)
          .limit(4);
        setRelevantProducts(relatedData || []);
      }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unwrappedParams.id, supabase]);

  // SMART FILTERING ENGINE
  const uniqueCapacities = product?.Variant ? Array.from(new Set(product.Variant.map((v: any) => v.capacity))) as string[] : [];
  const availableColorsForCapacity = product?.Variant ? product.Variant.filter((v: any) => v.capacity === selectedCapacity) : [];
  const currentVariant = product?.Variant?.find((v: any) => v.capacity === selectedCapacity && v.colorName === selectedColor);

  // DYNAMIC GALLERY ENGINE
  const displayImages = (currentVariant?.images?.length > 0 && currentVariant.images[0] !== "") 
    ? currentVariant.images 
    : (product?.Image?.map((i: any) => i.url) || []);

  // Reset image index when variant changes to prevent out-of-bounds errors
  useEffect(() => { setCurrentImageIndex(0); }, [currentVariant]);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);

  // Helper to silently update the URL when the user clicks a variant
  const updateUrlVariant = (color: string | null, cap: string | null) => {
    if (!color || !cap) return;
    const slug = `${color}-${cap}`.toLowerCase().replace(/\s+/g, '-');
    const params = new URLSearchParams(searchParams.toString());
    params.set('variant', slug);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCapacityChange = (newCapacity: string) => {
    setSelectedCapacity(newCapacity);
    const colorsForNewCap = product.Variant.filter((v: any) => v.capacity === newCapacity);
    const hasCurrentColor = colorsForNewCap.some((v: any) => v.colorName === selectedColor);
    
    let nextColor = selectedColor;
    if (!hasCurrentColor && colorsForNewCap.length > 0) {
      nextColor = colorsForNewCap[0].colorName;
      setSelectedColor(nextColor);
    }
    updateUrlVariant(nextColor, newCapacity);
  };

  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    updateUrlVariant(newColor, selectedCapacity);
  };

  const handleAddToCart = () => {
    const finalPrice = currentVariant?.price || product.basePrice;
    const finalImage = displayImages[0] || "";
    const finalVariantName = currentVariant ? `${currentVariant.capacity} - ${currentVariant.colorName}` : "Standard Size";
    const uniqueId = currentVariant ? `${product.id}-${currentVariant.id}` : product.id;

    // 1. Add to your local Zustand Cart Store
    addItem({ id: uniqueId, productId: product.id, name: product.name, shortName: product.shortName, price: finalPrice, quantity: quantity, image: finalImage, variantName: finalVariantName });
    
    // 2. Fire the exact eCommerce event to Google Analytics
    sendGAEvent('event', 'add_to_cart', {
      currency: 'INR',
      value: finalPrice * quantity,
      items: [{
        item_id: uniqueId,
        item_name: product.name,
        item_category: product.category,
        item_variant: finalVariantName,
        price: finalPrice,
        quantity: quantity
      }]
    });

    // 3. Show the UI Popup
    setShowCartPopup(true);
    setTimeout(() => setShowCartPopup(false), 3000);
  };

  const handleBuyNow = () => {
    const finalPrice = currentVariant?.price || product.basePrice;
    const finalImage = displayImages[0] || "";
    const finalVariantName = currentVariant ? `${currentVariant.capacity} - ${currentVariant.colorName}` : "Standard Size";
    const uniqueId = currentVariant ? `${product.id}-${currentVariant.id}` : product.id;

    addItem({ id: uniqueId, productId: product.id, name: product.name, shortName: product.shortName, price: finalPrice, quantity: quantity, image: finalImage, variantName: finalVariantName });
    router.push('/checkout');
  };
  
  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Product...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center font-bold text-brand-orange">Product not found.</div>;

  const displayPrice = currentVariant?.price || product.basePrice;
  const displayMrp = currentVariant?.mrp || product.mrp;
  const discountPercent = displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 md:pb-24">
      {/* GOOGLE SHOPPING JSON-LD SCHEMA */}
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product", 
              "name": product.name,
              "image": displayImages,
              "description": product.description,
              "brand": {
                "@type": "Brand",
                "name": "Ferixo"
              },
              "offers": {
                "@type": "Offer",
                "url": `https://www.ferixo.com/shop/${unwrappedParams.category}/${product.id}?variant=${searchParams.get('variant') || ''}`,
                "priceCurrency": "INR", 
                "price": displayPrice,
                "itemCondition": "https://schema.org/NewCondition",
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
              }
            })
          }}
        />
      )}
      {/* OPTIMIZED BREADCRUMBS - Increased desktop sizing */}
<div className="text-sm md:text-lg lg:text-xl pt-8 font-medium text-gray-500 mb-6 md:mb-8">
  <Breadcrumbs productName={product.shortName || product.name} />
</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
        
        {/* ==================================================================================== */}
        {/* LEFT COLUMN: THE GALLERY (Mobile: Top, Desktop: Left) */}
        {/* ==================================================================================== */}
        <div className="flex flex-col md:flex-row-reverse gap-4 md:gap-6 h-fit md:items-start">
          
          {/* Main 1:1 Carousel Image */}
          <div className="w-full relative aspect-square bg-white rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden group p-0">
            {displayImages.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayImages[currentImageIndex]} alt={product.shortName} className="w-full h-full object-cover transition-transform duration-500" />
            ) : (
              <span className="text-gray-300 font-bold uppercase tracking-widest text-sm">No Image Available</span>
            )}

            {/* Navigation Arrows */}
            {displayImages.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur text-primary p-2 md:p-3 rounded-full shadow-md border border-gray-100 hover:bg-white hover:text-brand-blue z-10">
                   <ChevronLeft size={24} />
                </button>
                <button onClick={nextImage} className="absolute right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur text-primary p-2 md:p-3 rounded-full shadow-md border border-gray-100 hover:bg-white hover:text-brand-blue z-10">
                   <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Grid */}
          {displayImages.length > 1 && (
            <div className="flex md:flex-col gap-2 lg:gap-3 overflow-x-auto md:overflow-y-auto flex-shrink-0 snap-x md:max-h-[600px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {displayImages.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex-shrink-0 snap-center rounded-xl md:rounded-2xl bg-white border-2 overflow-hidden transition-all duration-300 p-0 ${currentImageIndex === idx ? 'border-brand-blue shadow-md' : 'border-gray-100 opacity-60 hover:opacity-100'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ==================================================================================== */}
        {/* RIGHT COLUMN: DETAILS (Mobile: Reordered Flow | Desktop: Standard Flow) */}
        {/* ==================================================================================== */}
        <div className="flex flex-col">
           
           {/* CATEGORY TAG, NAME & PRICE */}
           <div className="order-3 md:order-1 mt-6 md:mt-0">
             <p className="text-brand-blue font-black uppercase tracking-widest text-xs md:text-sm mb-2">{product.category}</p>
             <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tighter leading-tight">
               {product.name}
             </h1>
             
             <div className="flex items-end gap-3 mt-3 md:mt-4 transition-all">
               <p className="text-2xl font-black text-brand-blue">₹{displayPrice}</p>
               {displayMrp > displayPrice && (
                 <>
                   <p className="text-lg font-bold text-gray-400 line-through mb-0.5">₹{displayMrp}</p>
                   <p className="text-sm font-black text-green-500 mb-1">{discountPercent}% OFF</p>
                 </>
               )}
             </div>
           </div>

           {/* TIER 2: COLORS (Mobile: Order 1 | Desktop: Order 2) */}
           <div className="order-1 md:order-2 mt-0 md:mt-8">
             {availableColorsForCapacity.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3 flex justify-between">
                    <span>Color</span>
                   {/* <span className="text-primary">{selectedColor}</span> */}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {availableColorsForCapacity.map((v: any) => (
                      <button 
                        key={v.id} 
                        onClick={() => handleColorChange(v.colorName)}
                        className={`p-1.5 pr-5 rounded-full border-2 transition-all font-bold text-sm flex items-center gap-3 ${selectedColor === v.colorName ? 'border-brand-blue bg-blue-50/50 text-primary shadow-sm' : 'border-transparent bg-canvas text-gray-500 hover:bg-gray-200 hover:border-gray-300'}`}
                      >
                        <span className="w-8 h-8 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: v.colorCode }}></span>
                        {v.colorName}
                      </button>
                    ))}
                  </div>
                </div>
             )}
           </div>

           {/* TIER 1: CAPACITY (Mobile: Order 2 | Desktop: Order 3) */}
           <div className="order-2 md:order-3 mt-6">
             {uniqueCapacities.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3 flex justify-between">
                    <span>Capacity</span>
                   {/* <span className="text-brand-blue">{selectedCapacity}</span>   */}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {uniqueCapacities.map((cap) => (
                      <button 
                        key={cap} 
                        onClick={() => handleCapacityChange(cap)}
                        className={`px-6 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${selectedCapacity === cap ? 'border-brand-blue bg-blue-50/50 text-brand-blue shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>
             )}
           </div>

           {/* QUANTITY (Mobile: Order 4 | Desktop: Order 4) */}
           <div className="order-4 md:order-4 mt-6">
              <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Quantity</h3>
              <div className="flex items-center gap-4 bg-canvas border border-gray-200 w-fit rounded-2xl p-1">
                 <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-gray-400 hover:text-primary transition-colors"><Minus size={18}/></button>
                 <span className="font-black text-primary w-8 text-center">{quantity}</span>
                 <button onClick={() => setQuantity(quantity + 1)} className="p-3 text-gray-400 hover:text-primary transition-colors"><Plus size={18}/></button>
              </div>
           </div>

           {/* CTAs (Mobile: Sticky Bottom via Fixed Class | Desktop: Order 5 inside flow) */}
           <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 pb-safe md:static md:bg-transparent md:border-none md:p-0 md:mt-8 md:order-5 z-40">
              <div className="max-w-7xl mx-auto flex gap-4 md:max-w-none">
                <button onClick={handleAddToCart} className="flex-1 bg-canvas border-2 border-gray-200 text-primary py-4 rounded-2xl font-black text-lg hover:border-brand-blue transition-all active:scale-95 flex items-center justify-center gap-2">
                  <ShoppingBag size={20} /> Add to Cart
                </button>
                <button onClick={handleBuyNow} className="flex-1 bg-brand-blue text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg shadow-brand-blue/30 active:scale-95">
                  Buy Now
                </button>
              </div>
           </div>

           </div> {/* <-- END OF RIGHT COLUMN */}
      </div> {/* <-- END OF 2-COLUMN GRID */}

      {/* ==================================================================================== */}
      {/* FULL WIDTH BOTTOM SECTION: DESCRIPTION & FEATURES */}
      {/* ==================================================================================== */}
      <div className="mt-16 md:mt-24 max-w-4xl mx-auto border-t border-gray-100 pt-12 md:pt-0">
         {/* DESCRIPTION */}
         <div className="mb-12">
            <h3 className="text-2xl font-black text-primary mb-4">About this product</h3>
            <p className="text-gray-500 font-medium leading-relaxed text-lg">
              {product.description}
            </p>
         </div>

         {/* FEATURES */}
         {product.Feature && product.Feature.length > 0 && (
           <div>
             <h3 className="text-2xl font-black text-primary mb-6">Key Features</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
               {product.Feature.map((f: any, index: number) => (
                 <div key={index} className="flex items-start gap-4 p-4 bg-canvas rounded-2xl border border-gray-100">
                   <div className="mt-1.5 w-2 h-2 rounded-full bg-brand-blue flex-shrink-0"></div>
                   <span className="text-base font-bold text-primary">{f.text}</span>
                 </div>
               ))}
             </div>
           </div>
         )}
      </div>
      
      {/* ==================================================================================== */}
      {/* GOOGLE REVIEWS */}
      {/* ==================================================================================== */}
      <ProductReviews productId={product.id} />
      
      {/* ==================================================================================== */}
      {/* RELEVANT PRODUCTS (Cross-Selling Loop) */}
      {/* ==================================================================================== */}
      {relevantProducts.length > 0 && (
        <div className="mt-20 md:mt-32 pt-12 md:pt-16 border-t border-gray-100">
           <div className="flex justify-between items-end mb-8 md:mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-primary flex items-center gap-3">
                  <ShoppingBag className="text-brand-blue" size={28} /> Continue Shopping
                </h2>
                <p className="text-gray-500 font-medium mt-2">Discover more engineered gear from Ferixo.</p>
              </div>
              <Link href="/shop/all" className="hidden md:flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-blue-700 transition-colors">
                View All <ArrowRight size={16} />
              </Link>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {relevantProducts.map((relProduct) => (
                 <ProductCard 
                   key={relProduct.id} 
                   product={relProduct} 
                 />
              ))}
           </div>
           
           <Link href="/shop/all" className="md:hidden mt-8 w-full bg-canvas text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-gray-200">
              View Entire Catalog <ArrowRight size={18} />
           </Link>
        </div>
      )}

      {/* ==================================================================================== */}
      {/* STICKY BOTTOM CTAs & POPUPS */}
      {/* ==================================================================================== */}
      

      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${showCartPopup ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}>
         <div className="bg-primary text-white p-4 pr-8 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
            <div className="bg-green-500/20 text-green-400 p-2 rounded-xl">
               <CheckCircle2 size={24} />
            </div>
            <div>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Added to Cart</p>
               <p className="font-black text-sm">
                 {quantity}x {product.shortName || product.name}
               </p>
               <p className="text-xs font-medium text-gray-300 mt-0.5">
                 {selectedCapacity} • {selectedColor}
               </p>
            </div>
         </div>
      </div>

    </div>
  );
}