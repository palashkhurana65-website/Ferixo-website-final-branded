"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import Link from "next/link";

interface FilterProps {
  category: string;
  allCapacities: string[];
  allColors: string[];
  minBound: number;
  maxBound: number;
}

export default function ShopFilters({ category, allCapacities, allColors, minBound, maxBound }: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Current active filters from URL
  const currentCapacity = searchParams.get("capacity");
  const currentColor = searchParams.get("color");
  const currentMin = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : minBound;
  const currentMax = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : maxBound;

  // Local state for UI
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: currentMin, max: currentMax });
  const [expanded, setExpanded] = useState({ price: true, capacity: true, color: true });

  // Sync local price state if URL changes externally
  useEffect(() => {
    setPriceRange({ min: currentMin, max: currentMax });
  }, [currentMin, currentMax]);

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("minPrice", priceRange.min.toString());
    params.set("maxPrice", priceRange.max.toString());
    router.push(`/shop/${category}?${params.toString()}`);
    setIsMobileOpen(false); // Close mobile menu on apply
  };

  const buildUrl = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    return `/shop/${category}?${params.toString()}`;
  };

  const clearAllFilters = () => {
    router.push(`/shop/${category}`);
    setIsMobileOpen(false);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      
      {/* Price Filter */}
      <div className="border-b border-gray-100 pb-6">
        <button onClick={() => toggleSection('price')} className="flex items-center justify-between w-full text-left font-black text-primary mb-4">
          Price Range {expanded.price ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded.price && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-4">
              <input 
                type="number" 
                min={minBound} max={priceRange.max} 
                value={priceRange.min} 
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                className="w-full bg-canvas border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:border-brand-blue"
              />
              <span className="text-gray-400 font-bold">-</span>
              <input 
                type="number" 
                min={priceRange.min} max={maxBound} 
                value={priceRange.max} 
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                className="w-full bg-canvas border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:border-brand-blue"
              />
            </div>
            <button onClick={applyPriceFilter} className="w-full bg-brand-blue text-white text-xs font-black uppercase tracking-widest py-3 rounded-lg hover:bg-blue-700 transition-all active:scale-95">
              Apply Price
            </button>
          </div>
        )}
      </div>

      {/* Capacity Filter */}
      <div className="border-b border-gray-100 pb-6">
        <button onClick={() => toggleSection('capacity')} className="flex items-center justify-between w-full text-left font-black text-primary mb-4">
          Capacity {expanded.capacity ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded.capacity && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
            <Link href={buildUrl('capacity', null)} className={`text-sm font-bold px-3 py-2 rounded-lg transition-colors ${!currentCapacity ? 'bg-blue-50 text-brand-blue' : 'text-gray-500 hover:text-primary'}`}>
              All Sizes
            </Link>
            {allCapacities.map(cap => (
              <Link key={cap} href={buildUrl('capacity', cap)} className={`text-sm font-bold px-3 py-2 rounded-lg transition-colors ${currentCapacity === cap ? 'bg-blue-50 text-brand-blue' : 'text-gray-500 hover:text-primary'}`}>
                {cap}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Color Filter */}
      <div className="pb-4">
        <button onClick={() => toggleSection('color')} className="flex items-center justify-between w-full text-left font-black text-primary mb-4">
          Color {expanded.color ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {expanded.color && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
            <Link href={buildUrl('color', null)} className={`text-sm font-bold px-3 py-2 rounded-lg transition-colors ${!currentColor ? 'bg-blue-50 text-brand-blue' : 'text-gray-500 hover:text-primary'}`}>
              All Colors
            </Link>
            {allColors.map(color => (
              <Link key={color} href={buildUrl('color', color)} className={`text-sm font-bold px-3 py-2 rounded-lg transition-colors ${currentColor === color ? 'bg-blue-50 text-brand-blue' : 'text-gray-500 hover:text-primary'}`}>
                {color}
              </Link>
            ))}
          </div>
        )}
      </div>

      {(currentCapacity || currentColor || currentMin > minBound || currentMax < maxBound) && (
        <button onClick={clearAllFilters} className="w-full border-2 border-gray-200 text-gray-500 text-xs font-black uppercase tracking-widest py-3 rounded-lg hover:border-gray-300 hover:text-primary transition-all">
          Clear Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* MOBILE STICKY NAVBAR */}
      <div className="md:hidden sticky top-[70px] z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 py-3 mb-6 -mx-4 px-4">
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="w-full flex items-center justify-between bg-canvas border border-gray-200 px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2 font-black text-primary">
            <Filter size={18} className="text-brand-blue" />
            Filters {(currentCapacity || currentColor) && <span className="bg-brand-blue text-white w-2 h-2 rounded-full inline-block"></span>}
          </div>
          {isMobileOpen ? <X size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
        </button>
        
        {/* Mobile Dropdown Body */}
        {isMobileOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl shadow-gray-200/20 p-6 z-50 max-h-[70vh] overflow-y-auto">
            <FilterContent />
          </div>
        )}
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <div className="sticky top-28 bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-8 border-b border-gray-100 pb-4">
            <Filter size={20} className="text-brand-blue" />
            <h2 className="text-lg font-black text-primary tracking-tight">Refine Results</h2>
          </div>
          <FilterContent />
        </div>
      </aside>
    </>
  );
}