import { Lock, CreditCard, Truck, Check } from "lucide-react";

export default function CheckoutPayment({ paymentMethod, setPaymentMethod, finalTotal, formData, handlePlaceOrder, loading }: any) {
  return (
    <div className="p-6 md:p-12 text-center slide-up-mobile">
      <div className="w-20 h-20 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-6">
         <Lock size={36} />
      </div>
      <h2 className="text-3xl font-black text-primary tracking-tight mb-2">Select Payment Method</h2>
      <p className="text-gray-500 font-medium mb-8">
        Total Amount: <span className="font-bold text-primary">₹{finalTotal.toFixed(2)}</span>
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
        <button
          type="button"
          onClick={() => setPaymentMethod("PREPAID")}
          className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
            paymentMethod === "PREPAID"
              ? "border-brand-blue bg-blue-50 text-brand-blue shadow-sm"
              : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <CreditCard size={32} className={`mb-3 ${paymentMethod === "PREPAID" ? "text-brand-blue" : "text-gray-400"}`} />
          <span className={`font-black text-base ${paymentMethod === "PREPAID" ? "text-brand-blue" : "text-primary"}`}>Pay Online</span>
          <span className="text-xs font-medium mt-1 opacity-80">UPI, Cards, NetBanking</span>
        </button>

        <button
          type="button"
          onClick={() => setPaymentMethod("COD")}
          className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
            paymentMethod === "COD"
              ? "border-brand-blue bg-blue-50 text-brand-blue shadow-sm"
              : "border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Truck size={32} className={`mb-3 ${paymentMethod === "COD" ? "text-brand-blue" : "text-gray-400"}`} />
          <span className={`font-black text-base ${paymentMethod === "COD" ? "text-brand-blue" : "text-primary"}`}>Cash on Delivery</span>
          <span className="text-xs font-medium mt-1 opacity-80">Pay when it arrives</span>
        </button>
      </div>

      <div className="bg-canvas p-4 rounded-2xl text-left border border-gray-200 mb-8 inline-block w-full max-w-md">
         <p className="text-xs uppercase font-bold text-gray-400 mb-1">Delivering to:</p>
         <p className="text-sm font-bold text-primary">{formData.fullName}</p>
         <p className="text-sm text-gray-500">{formData.address}, {formData.city}, {formData.state} - {formData.pin}</p>
      </div>

      <button 
        onClick={handlePlaceOrder} 
        disabled={loading} 
        className="w-full max-w-md mx-auto bg-brand-blue text-white py-4.5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-brand-blue/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          "Processing Order..."
        ) : paymentMethod === "PREPAID" ? (
          <>Pay Securely Now <Check size={20} /></>
        ) : (
          <>Confirm COD Order <Check size={20} /></>
        )}
      </button>
    </div>
  );
}