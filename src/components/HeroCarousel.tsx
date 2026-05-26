"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Placeholder data - replace the image paths with your actual files in the public folder
const slides = [
  {
    id: 1,
    desktopImg: "/hero/desktop-1.jpg", 
    mobileImg: "/hero/mobile-1.png",   
    title: "Premium Insulated Bottles",
    subtitle: "Engineered to keep your focus sharp and your drinks ice-cold for 24 hours.",
    ctaText: "Shop Bottles",
    ctaLink: "/shop/bottles",
  },
  {
    id: 2,
    desktopImg: "/hero/desktop-2.jpg",
    mobileImg: "/hero/mobile-2.jpg",
    title: "The Minimalist Tumbler",
    subtitle: "Matte black aesthetics meet studio-grade insulation for your daily commute.",
    ctaText: "Explore Tumblers",
    ctaLink: "/shop/tumblers",
  },
  {
    id: 3,
    desktopImg: "/hero/desktop-3.jpg", // 1920x1080
    mobileImg: "/hero/mobile-3.jpg",  // 1080x1350
    title: "Modern Coffee Cups",
    subtitle: "Start your morning right with a flawless, spill-proof design.",
    ctaText: "View Coffee Cups",
    ctaLink: "/shop/coffee-cups",
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
    <div className="relative w-full h-[70vh] md:h-[80vh] lg:h-[85vh] bg-canvas group overflow-hidden">
      
      {/* Scrollable Track */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {slides.map((slide) => (
          <div key={slide.id} className="relative w-full h-full flex-shrink-0 snap-center">
            
            {/* Desktop Image Block (Hidden on mobile) */}
            <div className="hidden md:block w-full h-full relative">
              <div className="absolute inset-0 bg-black/30 z-10"></div> {/* Dark overlay for text readability */}
              <Image 
                src={slide.desktopImg}
                alt={slide.title}
                fill
                priority={slide.id === 1}
                className="object-cover object-center"
              />
            </div>

            {/* Mobile Image Block (Hidden on desktop) */}
            <div className="block md:hidden w-full h-full relative">
               <div className="absolute inset-0 bg-black/40 z-10"></div> {/* Slightly darker overlay for mobile */}
               <Image 
                src={slide.mobileImg}
                alt={slide.title}
                fill
                priority={slide.id === 1}
                className="object-cover object-center"
              />
            </div>

            {/* Text & CTA Overlay */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center px-4 md:px-8">
               <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
                 {slide.title}
               </h1>
               <p className="text-lg md:text-xl text-gray-200 font-medium mb-8 max-w-2xl animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
                 {slide.subtitle}
               </p>
               <Link href={slide.ctaLink} className="bg-brand-blue text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-blue-600 transition-colors shadow-xl shadow-brand-blue/20 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200 active:scale-95">
                 {slide.ctaText}
               </Link>
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
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              currentSlide === index 
                ? "w-8 h-2 bg-brand-blue" 
                : "w-2 h-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}