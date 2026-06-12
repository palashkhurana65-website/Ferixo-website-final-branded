import { useState, useEffect } from "react";
import Link from "next/link";
import { Gift, Sparkles, Plus, Loader2, X, ExternalLink, Check, Settings2 } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useCartStore } from "../../lib/store";

export default function MilestoneUpsellModal({ showUpsellModal, setShowUpsellModal, activeMilestone, subtotal, setStep }: any) {
  const [upsellProducts, setUpsellProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  
  const [variantModalProduct, setVariantModalProduct] = useState<any | null>(null);
  const [selectedVIndex, setSelectedVIndex] = useState<number>(0);
  
  const { addItem } = useCartStore();
  const supabase = createClient();

  useEffect(() => {
    if (showUpsellModal) {
      const fetchUpsells = async () => {
        setLoading(true);
        const { data } = await supabase
          .from('Product')
          .select('id, name, shortName, category, basePrice, Image(url), Variant(capacity, colorName, price)');
        
        if (data) setUpsellProducts(data);
        setLoading(false);
      };
      fetchUpsells();
    }
  }, [showUpsellModal, supabase]);

  const handleInitiateAdd = (product: any) => {
    if (product.Variant && product.Variant.length > 0) {
      setVariantModalProduct(product); 
      setSelectedVIndex(0); 
    } else {
      executeAdd(product, 0); 
    }
  };

  const executeAdd = (product: any, vIndex: number) => {
    setAddingId(product.id);
    
    const variant = product.Variant?.[vIndex];
    const price = variant && variant.price !== null ? variant.price : product.basePrice;
    const variantName = variant ? `${variant.capacity} - ${variant.colorName}` : "Standard Size";
    
    addItem({
      id: `${product.id}-${variantName}`,
      productId: product.id,
      name: product.name,
      shortName: product.shortName || product.name,
      price: price,
      quantity: 1,
      image: product.Image?.[0]?.url || "",
      variantName: variantName
    });

    setTimeout(() => {
      setAddingId(null);
      setVariantModalProduct(null); 
      
      if (subtotal + price >= activeMilestone.thresholdAmount) {
        setShowUpsellModal(false);
      }
    }, 600);
  };

  if (!showUpsellModal || !activeMilestone) return null;

  const remainingAmount = activeMilestone.thresholdAmount - subtotal;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={() => setShowUpsellModal(false)}></div>
      
      <div className="bg-canvas w-full max-w-2xl rounded-3xl relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* MAIN MODAL HEADER */}
        <div className="bg-white p-6 md:p-8 text-center relative border-b border-gray-100 flex-shrink-0">
          <button onClick={() => setShowUpsellModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-brand-orange bg-gray-50 rounded-full transition-colors">
             <X size={20}/>
          </button>
          
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <Gift size={32} className="text-brand-orange animate-bounce" />
            <Sparkles size={16} className="text-brand-blue absolute top-0 right-0 animate-pulse" />
          </div>
          
          <h3 className="text-2xl md:text-3xl font-black text-primary mb-2 tracking-tight">You're almost there!</h3>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Add just <span className="text-brand-orange font-black">₹{remainingAmount > 0 ? remainingAmount.toFixed(2) : '0.00'}</span> more to instantly unlock <span className="font-bold text-primary">{activeMilestone.rewardType === 'free_product' ? 'a FREE Gift' : 'a Special Discount'}</span>!
          </p>
        </div>

        {/* DYNAMIC PRODUCT LIST */}
        <div className="overflow-y-auto p-4 md:p-6 space-y-4 flex-1 bg-gray-50/50">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-16 text-gray-400">
               <Loader2 className="animate-spin mb-3 text-brand-blue" size={40}/>
               <p className="text-sm font-bold">Loading entire catalog...</p>
             </div>
          ) : (
             upsellProducts.map(product => (
                <div key={product.id} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-5 transition-all hover:border-blue-200 group">
                   
                   {/* 🚀 FIXED: Strict 1:1 aspect-square, larger desktop width, object-contain */}
                   <div className="w-full sm:w-36 aspect-square bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 relative p-2 md:p-3">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={product.Image?.[0]?.url || ""} alt={product.shortName || product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                   </div>
                   
                   <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">{product.category}</p>
                        <h4 className="font-bold text-primary text-lg leading-tight mb-1">{product.shortName || product.name}</h4>
                        <p className="font-black text-brand-blue text-lg">₹{product.basePrice}</p>
                      </div>
                      
                      {/* 🚀 FIXED: Mobile-optimized button row */}
                      <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t border-gray-50">
                        <Link 
                          href={`/shop/${(product.category || 'all').toLowerCase().replace(/ /g, '-')}/${product.id}?resumeCheckout=true`} 
                          className="bg-gray-50 text-gray-500 hover:text-brand-blue hover:bg-blue-50 px-3 md:px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap"
                        >
                          View Details <ExternalLink size={14} />
                        </Link>
                        
                        <button 
                          onClick={() => handleInitiateAdd(product)}
                          disabled={addingId === product.id}
                          className={`flex-1 sm:flex-none justify-center text-white text-sm font-black px-4 md:px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm ${addingId === product.id ? 'bg-green-500' : 'bg-primary hover:bg-gray-900 active:scale-95'}`}
                        >
                          {addingId === product.id ? (
                            <><Check size={16}/> Added</>
                          ) : product.Variant && product.Variant.length > 0 ? (
                            <><Settings2 size={16}/> Select Variant</>
                          ) : (
                            <><Plus size={16}/> Add</>
                          )}
                        </button>
                      </div>
                   </div>
                </div>
             ))
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-white p-4 md:p-6 border-t border-gray-100 flex-shrink-0">
           <button 
              onClick={() => {
                setShowUpsellModal(false);
                setStep(3); 
              }} 
              className="w-full bg-canvas text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-200 hover:text-primary transition-all"
            >
              No thanks, skip to payment
            </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* NESTED VARIANT SELECTION MODAL */}
      {/* ============================================================== */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setVariantModalProduct(null)}></div>
          
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={() => setVariantModalProduct(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full transition-colors">
               <X size={20}/>
            </button>
            
            <h3 className="text-xl font-black text-primary mb-4 pr-6">Select Options</h3>
            
            <div className="flex gap-4 mb-6 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={variantModalProduct.Image?.[0]?.url || ""} className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-bold text-primary text-sm line-clamp-2 leading-tight">{variantModalProduct.shortName || variantModalProduct.name}</p>
                <p className="font-black text-brand-blue text-sm mt-1">
                  ₹{variantModalProduct.Variant?.[selectedVIndex]?.price !== null ? variantModalProduct.Variant[selectedVIndex].price : variantModalProduct.basePrice}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Available Variants</p>
              {variantModalProduct.Variant.map((v: any, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedVIndex(idx)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex justify-between items-center ${selectedVIndex === idx ? 'border-brand-blue bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}
                >
                  <span className={`font-bold text-sm ${selectedVIndex === idx ? 'text-brand-blue' : 'text-primary'}`}>
                    {v.capacity} - {v.colorName}
                  </span>
                  <span className="text-xs font-black text-gray-500">
                    ₹{v.price !== null ? v.price : variantModalProduct.basePrice}
                  </span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => executeAdd(variantModalProduct, selectedVIndex)} 
              className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-gray-900 active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              <Plus size={18}/> Confirm & Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}