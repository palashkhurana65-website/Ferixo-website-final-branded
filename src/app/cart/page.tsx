"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "../../lib/store";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Truck } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        {/* ORDER SUMMARY */}
        <div className="w-full lg:w-[380px]">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
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
    // 🚀 META PIXEL: Track Initiate Checkout
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: subtotal,
        currency: 'INR',
        num_items: items.length
      });
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
  );
}