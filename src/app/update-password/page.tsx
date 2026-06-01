"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);

  // When the page loads, Supabase automatically parses the secure token from the URL.
  // We just need to verify that the session was successfully established.
  useEffect(() => {
    const verifyAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If there's no session, the link is expired or invalid
        router.push("/login?error=expired-link");
      } else {
        setVerifyingSession(false);
      }
    };

    verifyAccess();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Since they are technically "logged in" via the recovery link, 
    // we use updateUser to overwrite their old password.
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setIsSuccess(true);
      setLoading(false);
      
      // Auto-redirect to the login or admin dashboard after 2 seconds
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 2000);
    }
  };

  if (verifyingSession) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-brand-blue mb-4" size={32} />
        <p className="text-gray-500 font-bold animate-pulse">Verifying secure link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-primary tracking-tight">Secure Your Account</h1>
          <p className="text-sm text-gray-500 font-medium mt-2">Enter your new password below.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100 text-center">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 text-center">
            <div className="bg-green-50 text-green-600 p-8 rounded-2xl flex flex-col items-center gap-4 border border-green-100">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <p className="font-bold text-[15px]">Password Updated!</p>
              <p className="text-sm font-medium text-green-700/80">
                Logging you into your dashboard securely...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in">
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="New Password"
                required
                className="w-full bg-canvas border border-gray-200 rounded-xl py-4 pl-12 pr-12 text-[16px] text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-medium placeholder:text-gray-400" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors p-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Confirm New Password"
                required
                className="w-full bg-canvas border border-gray-200 rounded-xl py-4 pl-12 pr-12 text-[16px] text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-medium placeholder:text-gray-400" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !password || !confirmPassword}
              className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-[16px] hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Saving...</> : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}