"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({ productName }: { productName?: string }) {
  const pathname = usePathname();
  const paths = pathname.split('/').filter(Boolean);

  return (
    // 1. Changed static 'text-xs' to responsive 'text-xs md:text-sm lg:text-base'
    <nav className="flex items-center space-x-2 text-xs md:text-sm lg:text-base font-bold text-gray-400 overflow-x-auto no-scrollbar py-4 whitespace-nowrap">
      <Link href="/" className="hover:text-primary transition-colors flex items-center">
        {/* 2. Replaced fixed size={14} with responsive width/height classes */}
        <Home className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5" />
      </Link>
      
      {paths.map((path, index) => {
        const isLast = index === paths.length - 1;
        const href = `/${paths.slice(0, index + 1).join('/')}`;
        
        let displayName = path.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (isLast && productName) displayName = productName;

        return (
          <div key={path} className="flex items-center space-x-2">
            {/* 3. Replaced fixed size={14} with responsive width/height classes here too */}
            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-gray-300" />
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