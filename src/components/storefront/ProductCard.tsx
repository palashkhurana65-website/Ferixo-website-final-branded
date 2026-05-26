import Link from "next/link";

export default function ProductCard({ product, category }: { product: any, category: string }) {
  // Extract unique colors and capacities from variants
  const uniqueColors = Array.from(new Set(product.Variant?.map((v: any) => v.colorCode) || []));
  const uniqueCapacities = Array.from(new Set(product.Variant?.map((v: any) => v.capacity) || []));

  return (
    <Link href={`/shop/${category}/${product.id}`} className="group block">
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-brand-blue">
        
        {/* Image Area */}
        <div className="aspect-[4/5] bg-canvas relative overflow-hidden flex items-center justify-center p-4">
          {product.Image && product.Image[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.Image[0].url} alt={product.shortName || product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out" />
          ) : (
            <span className="text-gray-300 font-bold tracking-widest uppercase text-xs">No Image</span>
          )}
        </div>

        {/* Data Area */}
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-primary text-lg tracking-tight truncate pr-4">
              {product.shortName || product.name}
            </h3>
            <span className="font-black text-primary text-lg">₹{product.basePrice}</span>
          </div>

          <div className="flex justify-between items-center mt-4">
            {/* Capacities */}
            <div className="text-xs font-bold text-gray-400">
               {uniqueCapacities.join(" / ")}
            </div>
            
            {/* Color Swatches */}
            <div className="flex -space-x-1">
              {uniqueColors.slice(0, 4).map((color: any, i) => (
                <div key={i} className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
              ))}
              {uniqueColors.length > 4 && (
                <div className="w-4 h-4 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                  +{uniqueColors.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}