import { useState, useEffect } from "react";
import { ShoppingBag, Gift, Sparkles, Truck, ArrowRight } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

export default function CheckoutSummary({
  items, activeMilestone, subtotal, hasFreeGift, promoCode, setPromoCode, 
  discountPercent, setDiscountPercent, promoError, handleApplyPromo, 
  milestoneDiscountAmount, promoDiscountAmount, taxableAmount, totalTax, 
  isPunjab, finalTotal, setStep, setShowUpsellModal
}: any) {
  
  // 🚀 NEW: State to hold the exact details of the free reward product
  const [freeRewardProduct, setFreeRewardProduct] = useState<any>(null);

  useEffect(() => {
    const fetchRewardProduct = async () => {
      if (activeMilestone?.rewardType === 'free_product' && activeMilestone?.rewardValue) {
        const supabase = createClient();
        const { data } = await supabase
          .from('Product')
          .select('id, name, shortName, basePrice, Image(url)')
          .eq('id', activeMilestone.rewardValue)
          .single();
          
        if (data) setFreeRewardProduct(data);
      }
    };
    fetchRewardProduct();
  }, [activeMilestone]);

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-6 md:space-y-8 slide-up-mobile">
      
      {/* 🚀 OPTIMIZED: MILESTONE PROGRESS BAR */}
      {activeMilestone && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8 rounded-2xl md:rounded-3xl border md:border-2 border-brand-blue/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10">
            <Gift className="w-16 h-16 md:w-[100px] md:h-[100px]" />
          </div>
          
          {subtotal >= activeMilestone.thresholdAmount ? (
            <div className="flex items-center gap-3 md:gap-4 text-green-700 relative z-10">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-base md:text-xl">Milestone Unlocked!</h4>
                <p className="font-bold text-xs md:text-sm opacity-90">
                  {/* 🚀 FIXED: Dynamic Name Injection */}
                  {activeMilestone.rewardType === 'free_product' 
                    ? `Your FREE ${freeRewardProduct?.shortName || freeRewardProduct?.name || 'premium gift'} will be added!`
                    : `Your ${activeMilestone.rewardType === 'discount_percentage' ? activeMilestone.rewardValue + '%' : '₹' + activeMilestone.rewardValue} discount is active!`}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="bg-white p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-sm">
                  <Gift className="w-4 h-4 md:w-5 md:h-5 text-brand-blue" />
                </div>
                <h4 className="font-bold text-primary text-sm md:text-lg leading-tight">
                  Add <span className="text-brand-orange font-black text-base md:text-xl">₹{(activeMilestone.thresholdAmount - subtotal).toFixed(2)}</span> more to unlock<br/>
                  <span className="text-brand-blue font-black text-xs md:text-base">
                     {/* 🚀 FIXED: Dynamic Name Injection */}
                     {activeMilestone.rewardType === 'free_product' 
                        ? `a FREE ${freeRewardProduct?.shortName || freeRewardProduct?.name || 'Premium Gift'}` 
                        : 'a Special Discount'}!
                  </span>
                </h4>
              </div>
              
              <div className="w-full bg-white h-2.5 md:h-4 rounded-full overflow-hidden border border-blue-100 shadow-inner mb-4 md:mb-5">
                <div 
                  className="h-full bg-gradient-to-r from-brand-blue to-blue-400 rounded-full transition-all duration-700 ease-out relative"
                  style={{ width: `${Math.min(100, (subtotal / activeMilestone.thresholdAmount) * 100)}%` }}
                >
                   <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite] -skew-x-12"></div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowUpsellModal(true)}
                className="w-full bg-white text-brand-blue border-2 border-brand-blue py-2.5 md:py-3.5 rounded-xl font-black text-sm md:text-base hover:bg-brand-blue hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
              >
                 Avail the reward now <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      <h2 className="text-xl md:text-2xl font-black text-primary flex items-center gap-2 md:gap-3">
        <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-brand-blue" /> Order Summary
      </h2>
      
      <div className="space-y-3 md:space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar">
        {items.map((item: any) => (
          <div key={item.id} className="flex gap-3 md:gap-4 items-center bg-canvas p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-gray-200">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-lg md:rounded-xl p-1.5 md:p-2 flex-shrink-0 relative overflow-hidden shadow-sm aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.shortName || item.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-bold text-primary truncate text-sm md:text-base">{item.shortName || item.name}</h4>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium truncate mt-0.5">{item.variantName}</p>
              <p className="text-xs md:text-sm font-black text-brand-blue mt-1">₹{item.price} <span className="text-gray-400 font-bold text-[10px] md:text-xs ml-1">x{item.quantity}</span></p>
            </div>
          </div>
        ))}
      </div>
      
      {/* 🚀 FIXED: RENDER EXACT FREE GIFT DETAILS */}
      {hasFreeGift && freeRewardProduct && (
        <div className="flex gap-3 md:gap-4 items-center bg-blue-50/50 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-blue-100 relative overflow-hidden animate-in fade-in slide-in-from-right-4">
          <div className="absolute -left-6 top-2 bg-brand-blue text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest px-8 py-0.5 -rotate-45 shadow-sm">FREE</div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-lg md:rounded-xl p-1.5 md:p-2 flex-shrink-0 flex items-center justify-center border border-blue-100 shadow-sm ml-2 overflow-hidden aspect-square">
            {freeRewardProduct.Image?.[0]?.url ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={freeRewardProduct.Image[0].url} alt={freeRewardProduct.shortName} className="w-full h-full object-contain" />
            ) : (
               <Gift className="w-6 h-6 md:w-8 md:h-8 text-brand-blue opacity-50" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="font-bold text-brand-blue truncate text-sm md:text-base">{freeRewardProduct.shortName || freeRewardProduct.name}</h4>
            <p className="text-[10px] md:text-xs text-blue-500/80 font-medium truncate mt-0.5">Unlocked via Milestone</p>
            <p className="text-xs md:text-sm font-black text-primary mt-1 line-through opacity-50">₹{freeRewardProduct.basePrice}</p>
          </div>
        </div>
      )}

      <div className="bg-canvas p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-200">
         <label className="block text-[10px] md:text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Promo Code</label>
         <div className="flex gap-2">
           <input type="text" placeholder="Enter code" className="flex-1 bg-white border border-gray-200 rounded-lg md:rounded-xl p-2.5 md:p-3.5 text-primary outline-none focus:border-brand-blue font-mono uppercase text-xs md:text-sm" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} disabled={discountPercent > 0} />
           {discountPercent > 0 ? (
              <button type="button" onClick={() => { setDiscountPercent(0); setPromoCode(""); }} className="bg-red-50 text-red-500 px-4 md:px-6 rounded-lg md:rounded-xl font-bold text-xs md:text-sm">Remove</button>
           ) : (
              <button type="button" onClick={handleApplyPromo} className="bg-primary text-white px-4 md:px-6 rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:bg-gray-900 transition-colors">Apply</button>
           )}
         </div>
         {promoError && <p className="text-brand-orange text-[10px] md:text-xs font-bold mt-2">{promoError}</p>}
      </div>

      <div className="bg-gray-50 p-4 md:p-5 rounded-xl md:rounded-2xl space-y-2 border border-gray-100">
        <div className="flex justify-between text-xs md:text-sm font-bold text-gray-500">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {milestoneDiscountAmount > 0 && (
          <div className="flex justify-between text-xs md:text-sm font-bold text-brand-blue animate-in fade-in">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 md:w-4 md:h-4"/> {activeMilestone?.name}</span>
            <span>-₹{milestoneDiscountAmount.toFixed(2)}</span>
          </div>
        )}
        {discountPercent > 0 && (
          <div className="flex justify-between text-xs md:text-sm font-bold text-green-500">
            <span>Discount ({discountPercent}%)</span>
            <span>-₹{promoDiscountAmount.toFixed(2)}</span> 
          </div>
        )}
        
        <div className="border-t border-gray-200 my-2 pt-2 space-y-1">
          <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-400">
            <span>Taxable Value</span>
            <span>₹{taxableAmount.toFixed(2)}</span>
          </div>
          {isPunjab ? (
            <>
              <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-400">
                <span>CGST (9%)</span>
                <span>₹{(totalTax / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-400">
                <span>SGST (9%)</span>
                <span>₹{(totalTax / 2).toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-[10px] md:text-xs font-bold text-gray-400">
              <span>IGST (18%)</span>
              <span>₹{totalTax.toFixed(2)}</span>
            </div>
          )}
          <p className="text-[8px] md:text-[10px] text-gray-400 italic pt-1">*Total listed price is inclusive of GST</p>
        </div>

        <div className="flex justify-between items-end pt-3 border-t border-gray-200">
          <span className="text-sm md:text-base font-bold text-primary">Final Total</span>
          <span className="text-2xl md:text-3xl font-black text-brand-blue tracking-tighter">₹{finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <button 
        onClick={() => {
          if (activeMilestone && subtotal < activeMilestone.thresholdAmount) {
            setShowUpsellModal(true);
          } else {
            setStep(3);
          }
        }} 
        className="w-full bg-primary text-white py-3.5 md:py-4.5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-gray-900 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4"
      >
        Proceed to Payment <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  );
}