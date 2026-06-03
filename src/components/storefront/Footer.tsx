import Link from "next/link";
import { ShieldCheck, Mail, MapPin } from "lucide-react"; // Removed Facebook & Instagram from here

// Bulletproof Inline SVGs matching Lucide's exact styling
const FacebookIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 md:pt-24 pb-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* TOP SECTION: Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Ferixo" className="h-10 w-auto" />
            <p className="text-gray-500 font-regular leading-relaxed text-sm">
              Engineered for utility, designed for life. Ferixo delivers premium insulated gear built to withstand your daily grind, keeping your beverages perfectly tempered from dawn till dusk.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="https://www.instagram.com/ferixo_official/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-orange hover:text-white transition-colors">
                <InstagramIcon size={20} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61581297046241" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-brand-blue hover:text-white transition-colors">
                <FacebookIcon size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className="space-y-6">
            <h4 className="text-primary font-black uppercase tracking-widest text-sm">Shop Collections</h4>
            <ul className="space-y-4">
              <li><Link href="/shop/all" className="text-gray-500 hover:text-brand-blue font-bold text-sm transition-colors">All Products</Link></li>
              <li><Link href="/shop/bottles" className="text-gray-500 hover:text-brand-blue font-bold text-sm transition-colors">Insulated Bottles</Link></li>
              <li><Link href="/shop/tumblers" className="text-gray-500 hover:text-brand-blue font-bold text-sm transition-colors">Travel Tumblers</Link></li>
              <li><Link href="/shop/coffee-cups" className="text-gray-500 hover:text-brand-blue font-bold text-sm transition-colors">Coffee Cups</Link></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="space-y-6">
            <h4 className="text-primary font-black uppercase tracking-widest text-sm">Customer Support</h4>
            <ul className="space-y-4">
              <li><Link href="/support" className="text-gray-500 hover:text-brand-blue font-bold text-sm transition-colors">Help Center / FAQs</Link></li>
              
              <li><Link href="/returns" className="text-gray-500 hover:text-brand-blue font-bold text-sm transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/support" className="text-gray-500 hover:text-brand-blue font-bold text-sm transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact & Trust */}
          <div className="space-y-6">
            <h4 className="text-primary font-black uppercase tracking-widest text-sm">Get in Touch</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-500 font-medium text-sm">
                <Mail size={18} className="text-brand-blue flex-shrink-0 mt-0.5" />
                <a href="mailto:info@ferixo.com" className="hover:text-primary transition-colors">info@ferixo.com</a>
              </li>
              <li className="flex items-start gap-3 text-gray-500 font-medium text-sm">
                <MapPin size={18} className="text-brand-blue flex-shrink-0 mt-0.5" />
                <span>Bathinda, Punjab, India<br/>151001</span>
              </li>
            </ul>
            <div className="bg-canvas border border-gray-100 p-4 rounded-2xl flex items-center gap-3 mt-6">
               <div className="text-green-500 bg-green-50 p-2 rounded-xl"><ShieldCheck size={24} /></div>
               <div>
                  <p className="text-xs font-black text-primary uppercase">Secure Checkout</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">256-bit SSL Encrypted</p>
               </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Legal & Copyright */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-gray-400 text-sm font-bold">
            &copy; {currentYear} Ferixo. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="text-gray-400 hover:text-primary font-bold text-xs uppercase tracking-wider transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-primary font-bold text-xs uppercase tracking-wider transition-colors">Terms of Service</Link>
            <Link href="/returns" className="text-gray-400 hover:text-primary font-bold text-xs uppercase tracking-wider transition-colors">Refund Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}