"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({ productName }: { productName?: string }) {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-2 text-xs font-bold text-gray-400 overflow-x-auto no-scrollbar py-4 whitespace-nowrap">
      <Link href="/" className="hover:text-primary transition-colors flex items-center">
        <Home size={14} />
      </Link>
      
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const href = `/${paths.slice(0, index + 1).join('/')}`;
        
        // Format the string (e.g., 'coffee-cups' -> 'Coffee Cups')
        let displayName = path.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Override the very last ID with the actual product shortName if provided
        if (isLast && productName) displayName = productName;

        return (
          <div key={path} className="flex items-center space-x-2">
            <ChevronRight size={14} className="text-gray-300" />
            {isLast ? (
              <span className="text-primary">{displayName}</span>
            ) : (
              <Link href={href} className="hover:text-primary transition-colors">
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}