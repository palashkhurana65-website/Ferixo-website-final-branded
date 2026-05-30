"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "../../lib/store";
import { Lock, Tag, ArrowRight, ShoppingBag, MapPin, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import { trackMetaPurchase } from "../actions/metaCapi";

const loadScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", address: "", city: "", state: "", pin: "" });
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingPin, setFetchingPin] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // AUTO-LOCATION DETECTION
  useEffect(() => {
    if (formData.pin.length === 6) {
      setFetchingPin(true);
      fetch(`https://api.postalpincode.in/pincode/${formData.pin}`)
        .then(res => res.json())
        .then(data => {
          if (data[0].Status === "Success") {
            const postOffice = data[0].PostOffice[0];
            setFormData(prev => ({ ...prev, city: postOffice.Block, state: postOffice.State }));
          }
        })
        .finally(() => setFetchingPin(false));
    }
  }, [formData.pin]);

  // FINANCIALS & TAX MATH (Inclusive of 18% GST)
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const finalTotal = subtotal - discountAmount;
  
  const taxableAmount = finalTotal / 1.18;
  const totalTax = finalTotal - taxableAmount;
  const isPunjab = formData.state.toLowerCase().includes("punjab");

  const handleApplyPromo = async () => {
    setPromoError("");
    if (!promoCode) return;
    try {
      const res = await fetch('/api/coupons'); 
      const coupons = await res.json();
      
      const match = coupons.find((c: any) => c.code === promoCode.toUpperCase() && c.isActive);
      
      // FIXED: Changed match.discountPercentage to match.discount to match the database
      if (match) {
        setDiscountPercent(match.discount);
      } else { 
        setPromoError("Invalid or expired code."); 
        setDiscountPercent(0); 
      }
    } catch (err) { 
      setPromoError("Error validating code."); 
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);

    // ====================================================================
    // BYPASS RAZORPAY FOR 100% FREE ORDERS (< ₹1.00)
    // ====================================================================
    if (finalTotal < 1) {
      try {
        const payload = {
          items, 
          shippingAddress: formData,
          couponCode: discountPercent > 0 ? promoCode.toUpperCase() : null,
          totalAmount: subtotal, 
          finalAmount: finalTotal, // Will be 0
          razorpayPaymentId: "FREE_ORDER_100_DISCOUNT" // Dummy ID for database
        };
        const dbRes = await fetch('/api/checkout', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload)
        });
        
        if (!dbRes.ok) {
          const errorData = await dbRes.json();
          throw new Error(errorData.error || errorData.message || "Database transaction failed");
        }
        
        // 🚀 META CAPI: Track 100% Discounted/Free Orders
        await trackMetaPurchase({
          orderId: `FREE_${Date.now()}`,
          value: subtotal, // Send the original value so Meta knows the cart worth
          currency: "INR",
          userEmail: formData.email,
          userPhone: formData.phone,
        });
        
        clearCart();
        router.push('/order-success');
        return; // Exit function so it doesn't try to load Razorpay
      } catch (err: any) { 
        alert(`Failed to record free order: ${err.message}`); 
        setLoading(false);
        return;
      }
    }

    // ====================================================================
    // STANDARD RAZORPAY CHECKOUT FOR PAID ORDERS
    // ====================================================================
    const resScript = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!resScript) {
      alert("Razorpay failed to load. Please check your connection.");
      setLoading(false);
      return;
    }

    try {
      const orderRes = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, couponCode: discountPercent > 0 ? promoCode.toUpperCase() : null })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Ferixo",
        description: "Premium Order Checkout",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const payload = {
              items, 
              shippingAddress: formData,
              couponCode: discountPercent > 0 ? promoCode.toUpperCase() : null,
              totalAmount: subtotal, 
              finalAmount: finalTotal,
              razorpayPaymentId: response.razorpay_payment_id
            };
            const dbRes = await fetch('/api/checkout', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            
            if (!dbRes.ok) {
              const errorData = await dbRes.json();
              throw new Error(errorData.error || errorData.message || "Database transaction failed");
            }
            
            // 🚀 META CAPI: Track Standard Paid Purchases
            await trackMetaPurchase({
              orderId: response.razorpay_payment_id,
              value: finalTotal, // Send the exact amount they paid
              currency: "INR",
              userEmail: formData.email,
              userPhone: formData.phone,
            });  

            clearCart();
            router.push('/order-success');
          } catch (err: any) { 
            console.error("🚨 CRITICAL BACKEND ERROR:", err);
            alert(`Payment successful, but order failed: ${err.message}. Your payment ID is ${response.razorpay_payment_id}.`); 
          }
        },
        prefill: { name: formData.fullName, email: formData.email, contact: formData.phone },
        theme: { color: "#004de7" }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
      paymentObject.on('payment.failed', () => alert("Payment failed or cancelled."));

    } catch (err: any) {
      alert(err.message || "Failed to initialize payment.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-canvas p-4 text-center">
        <ShoppingBag size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-black text-primary">Your cart is empty.</h2>
        <Link href="/shop/all" className="mt-6 bg-brand-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">Return to Shop</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 pb-32">
      
      {/* CHECKOUT BREADCRUMBS */}
      <nav className="flex items-center justify-center space-x-2 text-xs md:text-sm font-bold mb-10 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link href="/cart" className="text-gray-400 hover:text-primary transition-colors">Cart</Link>
        <ChevronRight size={14} className="text-gray-300" />
        <button onClick={() => setStep(1)} className={`${step >= 1 ? 'text-brand-blue' : 'text-gray-400'}`}>Address</button>
        <ChevronRight size={14} className="text-gray-300" />
        <button onClick={() => step >= 2 && setStep(2)} className={`${step >= 2 ? 'text-brand-blue' : 'text-gray-400'} ${step < 2 && 'cursor-not-allowed'}`}>Summary</button>
        <ChevronRight size={14} className="text-gray-300" />
        <span className={`${step === 3 ? 'text-primary' : 'text-gray-400'}`}>Payment</span>
      </nav>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* STEP 1: ADDRESS */}
        {step === 1 && (
          <form onSubmit={handleAddressSubmit} className="p-6 md:p-10 space-y-6 slide-up-mobile">
            <h2 className="text-2xl font-black text-primary flex items-center gap-3"><MapPin className="text-brand-blue" /> Shipping Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Full Name</label>
                <input type="text" required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Email Address</label>
                <input type="email" required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Phone Number</label>
              <input type="tel" required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="relative">
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">PIN Code</label>
                <input type="text" required maxLength={6} className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium" value={formData.pin} onChange={(e) => setFormData({...formData, pin: e.target.value})} />
                {fetchingPin && <MapPin size={16} className="absolute right-4 top-1/2 mt-3 text-brand-blue animate-pulse" />}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">City</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-primary outline-none font-medium" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">State</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-primary outline-none font-medium" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Street Address</label>
              <textarea rows={3} required className="w-full bg-canvas border border-gray-200 rounded-xl p-4 text-primary outline-none focus:border-brand-blue font-medium resize-none" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-4.5 rounded-2xl font-black text-lg hover:bg-gray-900 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4">
              Continue to Summary <ArrowRight size={20} />
            </button>
          </form>
        )}

        {/* STEP 2: SUMMARY */}
        {step === 2 && (
          <div className="p-6 md:p-10 space-y-8 slide-up-mobile">
             <h2 className="text-2xl font-black text-primary flex items-center gap-3"><ShoppingBag className="text-brand-blue" /> Order Summary</h2>
             
             <div className="space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center bg-canvas p-3 rounded-2xl border border-gray-200">
                  {/* 1:1 Aspect Ratio Box */}
                  <div className="w-20 h-20 bg-white rounded-xl p-2 flex-shrink-0 relative overflow-hidden shadow-sm aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.shortName || item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-primary truncate text-base">{item.shortName || item.name}</h4>
                    <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{item.variantName}</p>
                    <p className="text-sm font-black text-brand-blue mt-1">₹{item.price} <span className="text-gray-400 font-bold text-xs ml-1">x{item.quantity}</span></p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-canvas p-4 rounded-2xl border border-gray-200">
               <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-bold">Promo Code</label>
               <div className="flex gap-2">
                 <input type="text" placeholder="Enter code" className="flex-1 bg-white border border-gray-200 rounded-xl p-3.5 text-primary outline-none focus:border-brand-blue font-mono uppercase text-sm" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} disabled={discountPercent > 0} />
                 {discountPercent > 0 ? (
                    <button type="button" onClick={() => { setDiscountPercent(0); setPromoCode(""); }} className="bg-red-50 text-red-500 px-6 rounded-xl font-bold text-sm">Remove</button>
                 ) : (
                    <button type="button" onClick={handleApplyPromo} className="bg-primary text-white px-6 rounded-xl font-bold text-sm hover:bg-gray-900 transition-colors">Apply</button>
                 )}
               </div>
               {promoError && <p className="text-brand-orange text-xs font-bold mt-2">{promoError}</p>}
            </div>

            {/* LIVE TAX CALCULATION ENGINE */}
            <div className="bg-gray-50 p-5 rounded-2xl space-y-2 border border-gray-100">
              <div className="flex justify-between text-sm font-bold text-gray-500">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-sm font-bold text-green-500">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 my-2 pt-2 space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>Taxable Value</span>
                  <span>₹{taxableAmount.toFixed(2)}</span>
                </div>
                {isPunjab ? (
                  <>
                    <div className="flex justify-between text-xs font-bold text-gray-400">
                      <span>CGST (9%)</span>
                      <span>₹{(totalTax / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-400">
                      <span>SGST (9%)</span>
                      <span>₹{(totalTax / 2).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>IGST (18%)</span>
                    <span>₹{totalTax.toFixed(2)}</span>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 italic pt-1">*Total listed price is inclusive of GST</p>
              </div>

              <div className="flex justify-between items-end pt-3 border-t border-gray-200">
                <span className="text-base font-bold text-primary">Final Total</span>
                <span className="text-3xl font-black text-brand-blue tracking-tighter">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={() => setStep(3)} className="w-full bg-primary text-white py-4.5 rounded-2xl font-black text-lg hover:bg-gray-900 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4">
              Proceed to Payment <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 3: PAYMENT LOCK-IN */}
        {step === 3 && (
           <div className="p-6 md:p-12 text-center slide-up-mobile">
              <div className="w-20 h-20 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-6">
                 <Lock size={36} />
              </div>
              <h2 className="text-3xl font-black text-primary tracking-tight mb-2">Secure Payment</h2>
              <p className="text-gray-500 font-medium mb-8">You are about to pay <span className="font-bold text-primary">₹{finalTotal.toFixed(2)}</span>. Your connection is fully encrypted via Razorpay.</p>
              
              <div className="bg-canvas p-4 rounded-2xl text-left border border-gray-200 mb-8 inline-block w-full max-w-sm">
                 <p className="text-xs uppercase font-bold text-gray-400 mb-1">Delivering to:</p>
                 <p className="text-sm font-bold text-primary">{formData.fullName}</p>
                 <p className="text-sm text-gray-500">{formData.address}, {formData.city}, {formData.state} - {formData.pin}</p>
              </div>

              <button onClick={handlePlaceOrder} disabled={loading} className="w-full max-w-sm mx-auto bg-brand-blue text-white py-4.5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-brand-blue/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? "Connecting to Bank..." : "Pay Securely Now"} <Check size={20} />
              </button>
           </div>
        )}
      </div>
    </div>
  );
}