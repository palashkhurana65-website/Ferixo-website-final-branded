"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '../../lib/supabase/client';
import { Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name: name, phone_number: phone }, // Stores name and phone in Supabase Auth
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/admin/products");
      router.refresh();
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 my-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Create Account</h1>
          <p className="text-sm text-gray-500 font-medium mt-2">Join the Ferixo ecosystem.</p>
        </div>
        
        {error && (
          <div className="bg-orange-50 text-brand-orange p-4 rounded-xl text-sm font-bold mb-6 border border-brand-orange/20 text-center">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleSignup}
          type="button" 
          className="w-full bg-white border-2 border-gray-100 text-primary py-3.5 rounded-xl font-bold hover:border-brand-blue hover:text-brand-blue transition-all flex items-center justify-center gap-3 mb-6 active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-gray-200 w-full absolute"></div>
          <span className="bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest relative">Or Register Below</span>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Full Name"
              required
              className="w-full bg-canvas border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-[16px] text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-medium placeholder:text-gray-400" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="tel" 
              placeholder="Phone Number"
              required
              className="w-full bg-canvas border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-[16px] text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-medium placeholder:text-gray-400" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>

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

          <div className="relative">
             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Create Password"
              required
              minLength={6}
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
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Confirm Password"
              required
              minLength={6}
              className="w-full bg-canvas border border-gray-200 rounded-xl py-4 pl-12 pr-12 text-[16px] text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all font-medium placeholder:text-gray-400" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
            <button 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors p-1"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-[16px] hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? "Setting up account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-sm text-gray-500 font-medium">
             Already have an account? <Link href="/login" className="text-brand-orange font-bold hover:underline">Sign In</Link>
           </p>
        </div>
      </div>
    </div>
  );
}