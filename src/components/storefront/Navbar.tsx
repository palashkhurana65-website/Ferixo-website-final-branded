"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, X, User, LifeBuoy, Info, Home, ArrowRight, MessageSquare } from "lucide-react";
import { useCartStore } from "../../lib/store";
import { createClient } from "../../lib/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Close menus and clear search on route change
  useEffect(() => { 
    setIsMobileMenuOpen(false); 
    setIsDesktopSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  // LIVE SEARCH ENGINE
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      
      try {
        const safeQuery = searchQuery.replace(/[,"]/g, '').trim();
        const { data, error } = await supabase
          .from('Product')
          .select('id, name, shortName, category, basePrice, Image(url)')
          .or(`name.ilike.%${safeQuery}%,shortName.ilike.%${safeQuery}%,category.ilike.%${safeQuery}%`)
          .limit(5);
        
        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, supabase]);

  return (
    <>
      <nav className="sticky top-0 z-[60] w-full bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-4 md:gap-8">
            
            {/* LOGO */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Ferixo" className="h-8 md:h-10 w-auto" />
            </Link>

            {/* DESKTOP NAVIGATION ICONS (Shifted to the Right) */}
            <div className="hidden md:flex items-center justify-end flex-1 gap-6">
              <Link href="/shop" className="text-sm font-bold text-gray-500 hover:text-brand-blue transition-colors">Shop</Link>
              <Link href="/about" className="text-sm font-bold text-gray-500 hover:text-brand-blue transition-colors">Story</Link>
              <Link href="/support" className="text-sm font-bold text-gray-500 hover:text-brand-blue transition-colors">Support</Link>
               <Link href="/reviews" className="text-sm font-bold text-gray-500 hover:text-brand-blue transition-colors">Community</Link>
              <div className="h-6 w-px bg-gray-200"></div>
              
              <button onClick={() => setIsDesktopSearchOpen(!isDesktopSearchOpen)} className="text-gray-400 hover:text-brand-blue transition-colors">
                <Search size={24} />
              </button>
              
              {/* FIXED: User button is now a Link to /account */}
              <Link href="/account" className="text-gray-400 hover:text-brand-blue transition-colors">
                <User size={24} />
              </Link>
              
              <Link href="/cart" className="relative text-gray-400 hover:text-brand-orange transition-colors">
                <ShoppingBag size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* MOBILE ICONS */}
            <div className="flex md:hidden items-center gap-5">
              <Link href="/cart" className="relative text-gray-500">
                <ShoppingBag size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-primary bg-canvas p-2 rounded-xl border border-gray-200">
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* DESKTOP SEARCH DROPDOWN OVERLAY */}
        {/* ========================================== */}
        {isDesktopSearchOpen && (
          <div className="hidden md:block absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl z-[70] animate-in slide-in-from-top-2 fade-in duration-200 pb-8">
            <div className="max-w-3xl mx-auto px-4 pt-8">
              
              <div className="relative flex items-center w-full h-16 rounded-2xl bg-gray-50 border border-gray-200 focus-within:border-brand-blue focus-within:bg-white focus-within:shadow-md transition-all overflow-hidden mb-6">
                 <div className="grid place-items-center h-full w-16 text-gray-400">
                    <Search size={24} />
                 </div>
                 <input
                    autoFocus
                    className="peer h-full w-full outline-none text-lg text-primary bg-transparent pr-4 font-medium"
                    type="text"
                    placeholder="Search gear, categories, or collections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <button onClick={() => {setIsDesktopSearchOpen(false); setSearchQuery('');}} className="pr-6 text-gray-400 hover:text-brand-orange transition-colors">
                   <X size={24} />
                 </button>
              </div>

              {/* Desktop Results Window */}
              {searchQuery.length >= 2 && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  {isSearching ? (
                    <div className="p-8 text-center text-sm font-bold text-gray-400 animate-pulse">Searching the catalog...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-[50vh] overflow-y-auto no-scrollbar py-4 px-2">
                      {searchResults.map((item) => (
                        <Link key={item.id} href={`/shop/${item.category.toLowerCase().replace(/ /g, '-')}/${item.id}`} className="flex items-center gap-6 p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                          <div className="w-16 h-16 bg-white border border-gray-100 rounded-xl p-2 flex-shrink-0 shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.Image?.[0]?.url || ""} alt={item.shortName} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                             <p className="text-xs font-black text-brand-blue uppercase tracking-widest mb-1">{item.category}</p>
                             <p className="text-lg font-bold text-primary truncate">{item.shortName || item.name}</p>
                          </div>
                          <p className="text-lg font-black text-primary pr-4">₹{item.basePrice}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm font-bold text-gray-400">No results found for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ========================================== */}
      {/* MOBILE SIDEBAR DROPDOWN */}
      {/* ========================================== */}
      <div className={`fixed inset-0 z-[100] transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className={`absolute inset-0 bg-primary/20 backdrop-blur-sm transition-opacity ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setIsMobileMenuOpen(false)} />
        
        <div className="absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto">
          <div className="p-6 flex justify-between items-center border-b border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Ferixo" className="h-8 w-auto" />
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 bg-gray-50 p-2 rounded-xl hover:text-brand-orange"><X size={24} /></button>
          </div>
          
          <div className="p-6">
            
            {/* Mobile Search Input */}
            <div className="relative flex items-center w-full h-12 rounded-2xl bg-gray-50 border border-gray-200 mb-6 overflow-hidden focus-within:border-brand-blue transition-colors">
              <div className="grid place-items-center h-full w-12 text-gray-400"><Search size={20} /></div>
              <input
                className="peer h-full w-full outline-none text-sm text-primary bg-transparent pr-4 font-medium"
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* FIXED: Mobile Search Results Inline Display */}
            {searchQuery.length >= 2 && (
              <div className="mb-8 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-in fade-in">
                {isSearching ? (
                  <div className="p-4 text-center text-xs font-bold text-gray-400 animate-pulse">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-[40vh] overflow-y-auto no-scrollbar py-2 px-1">
                    {searchResults.map((item) => (
                      <Link key={item.id} href={`/shop/${item.category.toLowerCase().replace(/ /g, '-')}/${item.id}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg p-1 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.Image?.[0]?.url || ""} alt={item.shortName} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">{item.category}</p>
                           <p className="text-sm font-bold text-primary truncate">{item.shortName || item.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs font-bold text-gray-400">No results found</div>
                )}
              </div>
            )}

            <nav className="space-y-2">
              <Link href="/" className="flex items-center gap-4 p-4 rounded-2xl text-primary font-black hover:bg-brand-blue/5 hover:text-brand-blue transition-colors">
                <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center text-gray-400"><Home size={20} /></div> Home
              </Link>
              <Link href="/shop/all" className="flex items-center gap-4 p-4 rounded-2xl text-primary font-black hover:bg-brand-blue/5 hover:text-brand-blue transition-colors">
                <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center text-gray-400"><ShoppingBag size={20} /></div> Shop Collections
              </Link>
              <Link href="/account" className="flex items-center gap-4 p-4 rounded-2xl text-primary font-black hover:bg-brand-blue/5 hover:text-brand-blue transition-colors">
                <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center text-gray-400"><User size={20} /></div> My Account
              </Link>
              <Link href="/support" className="flex items-center gap-4 p-4 rounded-2xl text-primary font-black hover:bg-brand-blue/5 hover:text-brand-blue transition-colors">
                <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center text-gray-400"><LifeBuoy size={20} /></div> Help & Support
              </Link>
              <Link href="/reviews" className="flex items-center gap-4 p-4 rounded-2xl text-primary font-black hover:bg-brand-blue/5 hover:text-brand-blue transition-colors">
                <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center text-gray-400"><MessageSquare size={20} /></div> Reviews
              </Link>
             {/* <Link href="/about" className="flex items-center gap-4 p-4 rounded-2xl text-primary font-black hover:bg-brand-blue/5 hover:text-brand-blue transition-colors">
                <div className="w-10 h-10 rounded-xl bg-canvas flex items-center justify-center text-gray-400"><Info size={20} /></div> About Ferixo
              </Link>*/}
            </nav>
          </div>
          
          <div className="mt-auto p-6">
            <Link href="/cart" className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-brand-blue/20">
              View Cart {cartCount > 0 && `(${cartCount})`} <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}