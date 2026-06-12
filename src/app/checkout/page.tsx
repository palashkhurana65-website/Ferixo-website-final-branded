"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "../../lib/store";
import { ShoppingBag, ChevronRight } from "lucide-react";
import Link from "next/link";
import { trackMetaPurchase } from "../actions/metaCapi";
import { createClient } from "../../lib/supabase/client";

// Import the split UI Components
import CheckoutAddress from "../../components/checkout/CheckoutAddress";
import CheckoutSummary from "../../components/checkout/CheckoutSummary";
import CheckoutPayment from "../../components/checkout/CheckoutPayment";
import MilestoneUpsellModal from "../../components/checkout/MilestoneUpsellModal";

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
  
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("PREPAID");
  
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", address: "", city: "", state: "", pin: "" });
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingPin, setFetchingPin] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const { items, clearCart, activeMilestone, fetchActiveMilestone } = useCartStore();

  // 🚀 PHASE 3: LOAD DRAFT FROM STORAGE ON MOUNT
  useEffect(() => { 
    fetchActiveMilestone(); 
    
    const draft = sessionStorage.getItem("checkoutDraft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.step) setStep(parsed.step);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.promoCode) setPromoCode(parsed.promoCode);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
      } catch (e) { console.error("Draft parsing failed", e); }
    }
    
    setMounted(true); 
  }, [fetchActiveMilestone]);

  // 🚀 PHASE 3: CONTINUOUSLY SAVE PROGRESS TO STORAGE
  useEffect(() => {
    if (mounted) {
      sessionStorage.setItem("checkoutDraft", JSON.stringify({
        step, formData, promoCode, paymentMethod
      }));
    }
  }, [step, formData, promoCode, paymentMethod, mounted]);

  // Fetch Saved Addresses
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const [profileRes, addressRes] = await Promise.all([
          supabase.from('Profile').select('*').eq('id', session.user.id).single(),
          supabase.from('Address').select('*').eq('userId', session.user.id)
        ]);
        
        if (profileRes.data) setUserProfile(profileRes.data);
        if (addressRes.data && addressRes.data.length > 0) {
          setSavedAddresses(addressRes.data);
          
          // 🚀 PHASE 3 CHECK: Only auto-fill from Supabase if no draft exists!
          if (!sessionStorage.getItem("checkoutDraft")) {
            const defaultAddr = addressRes.data.find((a: any) => a.isDefault) || addressRes.data[0];
            setSelectedAddressId(defaultAddr.id);
            setFormData({
              fullName: profileRes.data?.fullName || "",
              email: profileRes.data?.email || "",
              phone: defaultAddr.phone || profileRes.data?.phone || "",
              address: defaultAddr.address || "",
              city: defaultAddr.city || "",
              state: defaultAddr.state || "",
              pin: defaultAddr.pin || ""
            });
          }
        }
      }
      setLoadingAddresses(false);
    };
    fetchUserData();
  }, []);

  const handleSelectSavedAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setFormData({
      fullName: userProfile?.fullName || "", email: userProfile?.email || "",
      phone: addr.phone || userProfile?.phone || "", address: addr.address || "",
      city: addr.city || "", state: addr.state || "", pin: addr.pin || ""
    });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setSelectedAddressId(null); 
  };

  // PIN Location
  useEffect(() => {
    if (formData.pin.length === 6) {
      setFetchingPin(true);
      fetch(`https://api.postalpincode.in/pincode/${formData.pin}`).then(res => res.json()).then(data => {
          if (data[0].Status === "Success") {
            const postOffice = data[0].PostOffice[0];
            setFormData(prev => ({ ...prev, city: postOffice.Block, state: postOffice.State }));
          }
        }).finally(() => setFetchingPin(false));
    }
  }, [formData.pin]);

  // Math Engine
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const promoDiscountAmount = (subtotal * discountPercent) / 100;
  
  let milestoneDiscountAmount = 0;
  let hasFreeGift = false;

  if (activeMilestone && subtotal >= activeMilestone.thresholdAmount) {
    if (activeMilestone.rewardType === 'discount_percentage') {
      milestoneDiscountAmount = (subtotal * parseFloat(activeMilestone.rewardValue)) / 100;
    } else if (activeMilestone.rewardType === 'discount_fixed') {
      milestoneDiscountAmount = parseFloat(activeMilestone.rewardValue);
    } else if (activeMilestone.rewardType === 'free_product') {
      hasFreeGift = true;
    }
  }

  const finalTotal = Math.max(0, subtotal - promoDiscountAmount - milestoneDiscountAmount);
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
      
      if (match) setDiscountPercent(match.discount);
      else { setPromoError("Invalid or expired code."); setDiscountPercent(0); }
    } catch (err) { setPromoError("Error validating code."); }
  };

  const handleAddressSubmit = (e: React.FormEvent) => { e.preventDefault(); setStep(2); };

  const handlePlaceOrder = async () => {
    setLoading(true);

    // ====================================================================
    // 1. FREE ORDERS (< ₹1.00)
    // ====================================================================
    if (finalTotal < 1) {
      try {
        const payload = { items, shippingAddress: formData, couponCode: discountPercent > 0 ? promoCode.toUpperCase() : null, totalAmount: subtotal, finalAmount: finalTotal, razorpayPaymentId: "FREE_ORDER_100_DISCOUNT", paymentMethod: "PREPAID" };
        const dbRes = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!dbRes.ok) throw new Error("Database transaction failed");
        
        await trackMetaPurchase({ orderId: `FREE_${Date.now()}`, value: subtotal, currency: "INR", userEmail: formData.email, userPhone: formData.phone });
        clearCart(); 
        sessionStorage.removeItem("checkoutDraft"); // 🚀 PHASE 3: Clear draft on success
        router.push('/order-success'); return;
      } catch (err: any) { alert(`Failed to record free order: ${err.message}`); setLoading(false); return; }
    }

    // ====================================================================
    // 2. COD WORKFLOW
    // ====================================================================
    if (paymentMethod === "COD") {
      try {
        const payload = { items, shippingAddress: formData, couponCode: discountPercent > 0 ? promoCode.toUpperCase() : null, totalAmount: subtotal, finalAmount: finalTotal, razorpayPaymentId: "COD_PENDING", paymentMethod: "COD" };
        const dbRes = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!dbRes.ok) throw new Error("Database transaction failed");
        
        await trackMetaPurchase({ orderId: `COD_${Date.now()}`, value: finalTotal, currency: "INR", userEmail: formData.email, userPhone: formData.phone });
        clearCart(); 
        sessionStorage.removeItem("checkoutDraft"); // 🚀 PHASE 3: Clear draft on success
        router.push('/order-success'); return;
      } catch (err: any) { alert(`Failed to record COD order: ${err.message}`); setLoading(false); return; }
    }

    // ====================================================================
    // 3. RAZORPAY CHECKOUT
    // ====================================================================
    const resScript = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!resScript) { alert("Razorpay failed to load. Please check your connection."); setLoading(false); return; }

    try {
      const orderRes = await fetch('/api/razorpay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, couponCode: discountPercent > 0 ? promoCode.toUpperCase() : null }) });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: orderData.amount, currency: orderData.currency, name: "Ferixo", description: "Premium Order Checkout", order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const payload = { items, shippingAddress: formData, couponCode: discountPercent > 0 ? promoCode.toUpperCase() : null, totalAmount: subtotal, finalAmount: finalTotal, razorpayPaymentId: response.razorpay_payment_id, paymentMethod: "PREPAID" };
            const dbRes = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!dbRes.ok) throw new Error("Database transaction failed");
            
            await trackMetaPurchase({ orderId: response.razorpay_payment_id, value: finalTotal, currency: "INR", userEmail: formData.email, userPhone: formData.phone });  
            clearCart(); 
            sessionStorage.removeItem("checkoutDraft"); // 🚀 PHASE 3: Clear draft on success
            router.push('/order-success');
          } catch (err: any) { console.error(err); alert(`Payment successful, but order failed: ${err.message}`); }
        },
        prefill: { name: formData.fullName, email: formData.email, contact: formData.phone }, theme: { color: "#004de7" }
      };

      const paymentObject = new (window as any).Razorpay(options); paymentObject.open();
      paymentObject.on('payment.failed', () => alert("Payment failed or cancelled."));
    } catch (err: any) { alert(err.message || "Failed to initialize payment."); } finally { setLoading(false); }
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
      
      <nav className="flex items-center justify-center space-x-3 text-base md:text-lg font-black mb-12 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link href="/cart" className="text-gray-400 hover:text-primary transition-colors">Cart</Link>
        <ChevronRight size={18} className="text-gray-300" />
        <button onClick={() => setStep(1)} className={`${step >= 1 ? 'text-brand-blue' : 'text-gray-400'} hover:text-brand-blue transition-colors`}>Address</button>
        <ChevronRight size={18} className="text-gray-300" />
        <button onClick={() => step >= 2 && setStep(2)} className={`${step >= 2 ? 'text-brand-blue' : 'text-gray-400'} ${step < 2 && 'cursor-not-allowed'} hover:text-brand-blue transition-colors`}>Summary</button>
        <ChevronRight size={18} className="text-gray-300" />
        <span className={`${step === 3 ? 'text-primary' : 'text-gray-400'}`}>Payment</span>
      </nav>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {step === 1 && (
          <CheckoutAddress formData={formData} handleFormChange={handleFormChange} handleAddressSubmit={handleAddressSubmit} fetchingPin={fetchingPin} loadingAddresses={loadingAddresses} savedAddresses={savedAddresses} selectedAddressId={selectedAddressId} handleSelectSavedAddress={handleSelectSavedAddress} userProfile={userProfile} />
        )}
        {step === 2 && (
          <CheckoutSummary items={items} activeMilestone={activeMilestone} subtotal={subtotal} hasFreeGift={hasFreeGift} promoCode={promoCode} setPromoCode={setPromoCode} discountPercent={discountPercent} setDiscountPercent={setDiscountPercent} promoError={promoError} handleApplyPromo={handleApplyPromo} milestoneDiscountAmount={milestoneDiscountAmount} promoDiscountAmount={promoDiscountAmount} taxableAmount={taxableAmount} totalTax={totalTax} isPunjab={isPunjab} finalTotal={finalTotal} setStep={setStep} setShowUpsellModal={setShowUpsellModal} />
        )}
        {step === 3 && (
          <CheckoutPayment paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} finalTotal={finalTotal} formData={formData} handlePlaceOrder={handlePlaceOrder} loading={loading} />
        )}
      </div>

      <MilestoneUpsellModal showUpsellModal={showUpsellModal} setShowUpsellModal={setShowUpsellModal} activeMilestone={activeMilestone} subtotal={subtotal} setStep={setStep} />
    </div>
  );
}