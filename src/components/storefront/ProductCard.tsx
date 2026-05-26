import Link from "next/link";
import Image from "next/image";

export default function ProductCard({ product }: { product: any }) {
  const variants = product.Variant || [];
  
  // Extract all unique capacities
  const uniqueCapacities = Array.from(new Set(variants.map((v: any) => v.capacity).filter(Boolean)));
  const capacityText = uniqueCapacities.length > 0 ? uniqueCapacities.join(", ") : "Premium";

  // Extract unique colors based on colorCode
  const uniqueColors = variants.reduce((acc: any[], current: any) => {
    const x = acc.find((item: any) => item.colorCode === current.colorCode);
    if (!x && current.colorCode) return acc.concat([current]);
    return acc;
  }, []);

  const imageUrl = product.Image?.[0]?.url || "/placeholder.png";

  return (
    <Link 
  href={`/shop/${product.category ? product.category.toLowerCase().replace(/\s+/g, '-') : 'all'}/${product.id}`} 
  className="group flex flex-col gap-3 md:gap-4"
>
      {/* Image Box - Edge-to-Edge 1:1 Square */}
      <div className="relative aspect-square w-full bg-canvas rounded-2xl border border-gray-100 overflow-hidden group-hover:border-brand-blue group-hover:shadow-md transition-all">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageUrl} 
          alt={product.shortName || product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
        />
      </div>
      
      {/* Product Details */}
      <div className="px-1 mt-1">
        <h3 className="text-sm md:text-base font-bold text-primary truncate">
          {product.shortName || product.name}
        </h3>
        
        {/* Capacities */}
        <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
          {capacityText}
        </p>
        
        {/* Price & Swatches Row */}
        <div className="flex items-center justify-between mt-2.5">
          <p className="text-sm md:text-base font-black text-brand-blue">
            ₹{product.basePrice}
          </p>
          
          {/* Color Swatches */}
          {uniqueColors.length > 0 && (
            <div className="flex items-center gap-1.5">
              {uniqueColors.slice(0, 4).map((c: any, i: number) => (
                <div 
                  key={i} 
                  title={c.colorName}
                  className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full shadow-sm border border-gray-200/60"
                  style={{ backgroundColor: c.colorCode }}
                />
              ))}
              {uniqueColors.length > 4 && (
                <span className="text-[10px] text-gray-400 font-bold ml-0.5">
                  +{uniqueColors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}