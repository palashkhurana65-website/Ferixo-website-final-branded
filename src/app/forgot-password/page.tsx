"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client"; // Adjust path if needed
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      // 🚀 FIX: Route this through the new API callback so the server sets the cookie!
      redirectTo: `${window.location.origin}/api/auth/callback?next=/update-password`,
    });

    if (error) {
      console.error("Supabase Email Error:", error); // <-- Added this for debugging
      setError(error.message);
      setLoading(false);
    } else {
      setIsSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      
      {/* Back Button */}
      <div className="w-full max-w-md mb-6">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-primary tracking-tight">Reset Password</h1>
          <p className="text-sm text-gray-500 font-medium mt-2">Enter your email and we'll send you a secure recovery link.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100 text-center">
            {error}
          </div>
        )}

        {isSent ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 text-center">
            <div className="bg-green-50 text-green-600 p-8 rounded-2xl flex flex-col items-center gap-4 border border-green-100">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <p className="font-bold text-[15px]">Recovery link sent!</p>
              <p className="text-sm font-medium text-green-700/80">
                Please check your inbox for <strong>{email}</strong> to set your new password.
              </p>
            </div>
            <button 
              onClick={() => setIsSent(false)} 
              className="mt-6 text-sm font-bold text-gray-400 hover:text-brand-blue transition-colors"
            >
              Try a different email address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email" 
                placeholder="Enter your email address"
                required
                className="w-full bg-canvas border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-[16px] text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-medium placeholder:text-gray-400" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !email.trim()}
              className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-[16px] hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Sending...</> : "Send Recovery Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}