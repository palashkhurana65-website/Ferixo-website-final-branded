"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Cleaned up data - just images and a blank link
const slides = [
  {
    id: 1,
    desktopImg: "/hero/desktop_thermo.jpg", 
    mobileImg: "/hero/mobile_thermo.jpg",   
    link: "/shop/bottles/560c29e3-81ad-4565-8760-31bfc3c210c0?variant=yellow-1000-ml", // Add your manual navigation paths here later
  },
  {
    id: 2,
    desktopImg: "/hero/desktop_flexhandle.jpg",
    mobileImg: "/hero/mobile_flexhandle.jpg",
    link: "/shop/tumblers/26faaa48-9dbe-4825-9a33-6851315a1333?variant=dusty-rose-900-ml",
  },  // /shop/coffee-cups/your-specific-product-id-here 
  {
    id: 3,
    desktopImg: "/hero/desktop_hydropro.jpg", 
    mobileImg: "/hero/mobile_hydropro.jpg",  
    link: "/shop/tumblers/6d06f14a-434b-470e-9fe7-7167ea51ae49?variant=white-1200-ml",
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-play functionality
  useEffect(() => {
    const timer = setInterval(() => {
      scrollToSlide((currentSlide + 1) % slides.length);
    }, 5000); // Changes slide every 5 seconds
    return () => clearInterval(timer);
  }, [currentSlide]);

  // Sync scroll position with the dot indicators
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollPosition = scrollRef.current.scrollLeft;
    const slideWidth = scrollRef.current.offsetWidth;
    const newIndex = Math.round(scrollPosition / slideWidth);
    if (newIndex !== currentSlide) setCurrentSlide(newIndex);
  };

  const scrollToSlide = (index: number) => {
    if (!scrollRef.current) return;
    const slideWidth = scrollRef.current.offsetWidth;
    scrollRef.current.scrollTo({
      left: slideWidth * index,
      behavior: "smooth",
    });
    setCurrentSlide(index);
  };

  return (
    // FIXED: Swapped vh heights for strict aspect ratios to perfectly fit your design canvas
    <div className="relative w-full aspect-[1080/1350] md:aspect-[1920/1080] bg-canvas group overflow-hidden">
      
      {/* Scrollable Track */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {slides.map((slide) => (
          <div key={slide.id} className="relative w-full h-full flex-shrink-0 snap-center">
            
            {/* The Blank Full-Screen Link */}
            <Link href={slide.link} className="absolute inset-0 z-20 block"></Link>

            {/* Desktop Image Block (Hidden on mobile) */}
            <div className="hidden md:block w-full h-full relative">
              <Image 
                src={slide.desktopImg}
                alt={`Slide ${slide.id}`}
                fill
                priority={slide.id === 1}
                className="object-cover object-center"
              />
            </div>

            {/* Mobile Image Block (Hidden on desktop) */}
            <div className="block md:hidden w-full h-full relative">
               <Image 
                src={slide.mobileImg}
                alt={`Slide ${slide.id}`}
                fill
                priority={slide.id === 1}
                className="object-cover object-center"
              />
            </div>
            
          </div>
        ))}
      </div>

      {/* Desktop Navigation Arrows (Visible on hover) */}
      <button 
        onClick={() => scrollToSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft size={28} />
      </button>
      <button 
        onClick={() => scrollToSlide((currentSlide + 1) % slides.length)}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight size={28} />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3 pointer-events-none">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSlide(index)}
            className={`transition-all duration-300 rounded-full pointer-events-auto ${
              currentSlide === index 
                ? "w-8 h-2 bg-brand-blue shadow-[0_0_8px_rgba(0,0,0,0.3)]" 
                : "w-2 h-2 bg-white/70 hover:bg-white/90 shadow-[0_0_4px_rgba(0,0,0,0.3)]"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}