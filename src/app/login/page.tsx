"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '../../lib/supabase/client';
import { Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isMagicLink, setIsMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. STANDARD PASSWORD LOGIN (For Admins / Registered Users)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/admin/products"); // Update this to /account if it's customer-facing
      router.refresh();
    }
  };

  // 2. MAGIC LINK LOGIN (For Guests who don't know their password)
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Redirects them to your callback route which sets the session
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMagicLinkSent(true);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Welcome Back</h1>
          <p className="text-sm text-gray-500 font-medium mt-2">Sign in to continue to Ferixo.</p>
        </div>

        {error && (
          <div className="bg-orange-50 text-brand-orange p-4 rounded-xl text-sm font-bold mb-6 border border-brand-orange/20 text-center">
            {error}
          </div>
        )}

        {magicLinkSent ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 text-center">
            <div className="bg-green-50 text-green-600 p-6 rounded-2xl mb-6 flex flex-col items-center gap-3 border border-green-100">
              <CheckCircle2 size={32} />
              <p className="font-bold text-sm">Magic link sent! Check your inbox for <strong>{email}</strong> to log in securely.</p>
            </div>
            <button onClick={() => setMagicLinkSent(false)} className="text-sm font-bold text-gray-400 hover:text-brand-blue transition-colors">
              Try a different email
            </button>
          </div>
        ) : (
          <>
            <button 
              onClick={handleGoogleLogin}
              type="button" 
              className="w-full bg-white border border-gray-200 text-primary py-3.5 rounded-xl font-bold hover:border-brand-blue hover:text-brand-blue transition-all flex items-center justify-center gap-3 mb-6 active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-gray-200 w-full absolute"></div>
              <span className="bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest relative">Or</span>
            </div>

            {/* LOGIN METHOD TOGGLE */}
            <div className="flex bg-gray-50 p-1.5 rounded-xl mb-6">
              <button 
                type="button" 
                onClick={() => setIsMagicLink(false)} 
                className={`flex-1 text-sm font-bold py-2 rounded-lg transition-all ${!isMagicLink ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-400 hover:text-primary'}`}
              >
                Password
              </button>
              <button 
                type="button" 
                onClick={() => setIsMagicLink(true)} 
                className={`flex-1 text-sm font-bold py-2 rounded-lg transition-all flex justify-center items-center gap-1.5 ${isMagicLink ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-400 hover:text-primary'}`}
              >
                <Sparkles size={14} /> Magic Link
              </button>
            </div>

            <form onSubmit={isMagicLink ? handleMagicLinkLogin : handleEmailLogin} className="space-y-4 animate-in fade-in">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="email" 
                  placeholder="Email Address"
                  required
                  className="w-full bg-canvas border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-[16px] text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-medium placeholder:text-gray-400" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>

              {!isMagicLink && (
                <>
                  <div className="relative animate-in fade-in slide-in-from-top-2">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password"
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
                  <div className="flex justify-end pt-1">
                    <Link href="#" className="text-sm font-bold text-gray-500 hover:text-brand-orange transition-colors">Forgot Password?</Link>
                  </div>
                </>
              )}

              {isMagicLink && (
                <p className="text-xs text-gray-500 font-medium pt-1 text-center">
                  We'll email you a secure, passwordless link to sign in instantly.
                </p>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-[16px] hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2"
              >
                {loading ? "Processing..." : isMagicLink ? "Send Secure Link" : "Sign In"}
              </button>
            </form>
          </>
        )}

        <div className="mt-8 text-center">
           <p className="text-sm text-gray-500 font-medium">
             Don't have an account? <Link href="/signup" className="text-brand-orange font-bold hover:underline">Sign Up</Link>
           </p>
        </div>
      </div>
    </div>
  );
}