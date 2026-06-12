"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "../../lib/store";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Truck, Gift, Sparkles } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, activeMilestone, fetchActiveMilestone } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchActiveMilestone(); // 🚀 Fetch active milestone on load
  }, [fetchActiveMilestone]);

  if (!mounted) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-canvas p-4 text-center">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <ShoppingBag size={48} className="text-gray-300" />
        </div>
        <h2 className="text-3xl font-black text-primary tracking-tight">Your cart is empty.</h2>
        <p className="text-gray-500 font-medium mt-2">Looks like you haven't added anything yet.</p>
        <Link href="/shop/all" className="mt-8 bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-lg shadow-brand-blue/30 active:scale-95">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 pb-32">
      <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter mb-8 md:mb-12">
        Your Cart
      </h1>
      
      {/* 🚀 NEW: MILESTONE PROGRESS BAR */}
      {activeMilestone && items.length > 0 && (
        <div className="mb-8 bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          {subtotal >= activeMilestone.thresholdAmount ? (
            <div className="flex items-center gap-4 text-green-600 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={24} className="fill-green-500" />
              </div>
              <div>
                <h4 className="font-black text-lg md:text-xl">Milestone Unlocked!</h4>
                <p className="font-bold text-sm md:text-base opacity-90">
                  {activeMilestone.rewardType === 'free_product' 
                    ? "Your FREE premium gift will be added to your order."
                    : `Your ${activeMilestone.rewardType === 'discount_percentage' ? activeMilestone.rewardValue + '%' : '₹' + activeMilestone.rewardValue} discount has been applied!`}
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in">
              <div className="flex items-center gap-3 mb-3">
                <Gift size={20} className="text-brand-blue" />
                <h4 className="font-bold text-primary text-sm md:text-base">
                  Add <span className="text-brand-orange font-black">₹{(activeMilestone.thresholdAmount - subtotal).toFixed(2)}</span> more to unlock {activeMilestone.rewardType === 'free_product' ? 'a FREE Gift' : 'a Special Discount'}!
                </h4>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-blue rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${Math.min(100, (subtotal / activeMilestone.thresholdAmount) * 100)}%` }}
                >
                   <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -skew-x-12"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* CART ITEMS */}
        <div className="flex-1 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
              <div className="w-full sm:w-28 h-28 bg-canvas rounded-2xl p-2 flex-shrink-0 relative overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.shortName || item.name} className="w-full h-full object-contain" />
              </div>
              
              <div className="flex-1 w-full flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-primary truncate">{item.shortName || item.name}</h3>
                  <p className="text-sm font-bold text-gray-500 mt-1">{item.variantName}</p>
                  <p className="text-lg font-black text-brand-blue mt-2">₹{item.price}</p>
                </div>

                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4">
                  <div className="flex items-center gap-4 bg-canvas border border-gray-200 rounded-xl p-1">
                    <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-2 text-gray-400 hover:text-primary transition-colors"><Minus size={16}/></button>
                    <span className="font-black text-primary w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 text-gray-400 hover:text-primary transition-colors"><Plus size={16}/></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-brand-orange text-sm font-bold flex items-center gap-1 transition-colors">
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ORDER SUMMARY & MILESTONE (Optimized for Desktop) */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 relative">
          
          <div className="sticky top-24 space-y-6">
            {/* 🚀 ENHANCED MILESTONE TRACKER (Sticky & Popping) */}
            {activeMilestone && items.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border-2 border-brand-blue/20 shadow-lg shadow-brand-blue/10 relative overflow-hidden transform transition-all hover:scale-[1.02]">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Gift size={80} /></div>
                
                {subtotal >= activeMilestone.thresholdAmount ? (
                  <div className="flex items-center gap-4 text-green-700 animate-in fade-in slide-in-from-bottom-2 relative z-10">
                    <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Sparkles size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg">Milestone Unlocked!</h4>
                      <p className="font-bold text-sm opacity-90">
                        {activeMilestone.rewardType === 'free_product' 
                          ? "Your FREE premium gift will be added!"
                          : `Your ${activeMilestone.rewardType === 'discount_percentage' ? activeMilestone.rewardValue + '%' : '₹' + activeMilestone.rewardValue} discount is active!`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-white p-2 rounded-xl shadow-sm"><Gift size={20} className="text-brand-blue" /></div>
                      <h4 className="font-bold text-primary text-base leading-tight">
                        Add <span className="text-brand-orange font-black text-lg">₹{(activeMilestone.thresholdAmount - subtotal).toFixed(2)}</span> more to unlock<br/>
                        <span className="text-brand-blue font-black">{activeMilestone.rewardType === 'free_product' ? 'a FREE Premium Gift' : 'a Special Discount'}!</span>
                      </h4>
                    </div>
                    <div className="w-full bg-white h-4 rounded-full overflow-hidden border border-blue-100 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-blue to-blue-400 rounded-full transition-all duration-700 ease-out relative"
                        style={{ width: `${Math.min(100, (subtotal / activeMilestone.thresholdAmount) * 100)}%` }}
                      >
                         <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite] -skew-x-12"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STANDARD SUMMARY BOX */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-black text-primary mb-6">Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-base font-bold text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-green-500 bg-green-50 p-3 rounded-xl border border-green-100">
                  <span className="flex items-center gap-2"><Truck size={18}/> Shipping</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                  <span className="text-lg font-bold text-primary">Total</span>
                  <span className="text-4xl font-black text-brand-blue tracking-tighter">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (typeof window !== "undefined" && window.fbq) {
                    window.fbq('track', 'InitiateCheckout', { value: subtotal, currency: 'INR', num_items: items.length });
                  }
                  router.push('/checkout');
                }} 
                className="w-full bg-primary text-white py-4.5 rounded-2xl font-black text-lg hover:bg-gray-900 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}