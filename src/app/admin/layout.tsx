"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, ShoppingBag, Ticket, LogOut, MessageSquare } from "lucide-react";
import { createClient } from "../../lib/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { name: "Inventory", href: "/admin/products", icon: Package },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket },
    { name: "Reviews", href: "/admin/reviews", icon: MessageSquare }, // Added Reviews here
  ];

  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-black text-primary tracking-tighter">FERIXO<span className="text-brand-blue">.</span></h1>
          <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-1">Admin Console</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20" : "text-gray-500 hover:bg-gray-50 hover:text-primary"}`}>
                <item.icon size={20} /> {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-brand-orange hover:bg-orange-50 w-full rounded-xl transition-colors font-bold">
            <LogOut size={20} /> Secure Logout
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-primary tracking-tighter">FERIXO<span className="text-brand-blue">.</span></h1>
        <button onClick={handleLogout} className="text-brand-orange p-2 bg-orange-50 rounded-lg"><LogOut size={18} /></button>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href} className={`flex flex-col items-center gap-1 p-2 ${isActive ? "text-brand-blue" : "text-gray-400"}`}>
              <item.icon size={24} className={isActive ? "fill-brand-blue/10" : ""} />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}