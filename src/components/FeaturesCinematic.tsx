import Image from "next/image";
import { ShieldCheck, Droplets, ThermometerSnowflake, Hammer, Sparkles } from "lucide-react";

export default function FeaturesCinematic() {
  const features = [
    { icon: ShieldCheck, title: "SUS 304 Stainless Steel", desc: "Food-grade, ultra-pure steel that never retains odors or flavors." },
    { icon: Droplets, title: "100% Leakproof", desc: "Precision-engineered seals for absolute confidence on the move." },
    { icon: ThermometerSnowflake, title: "Hot & Cold Retention", desc: "Advanced vacuum insulation keeps drinks ice cold or piping hot for hours." },
    { icon: Hammer, title: "Rigid & Tough Quality", desc: "Drop-resistant architecture built to survive the daily grind." },
    { icon: Sparkles, title: "Premium Matte Finish", desc: "Signature sweat-free exterior for a flawless, tactile grip." },
  ];

  return (
    <section className="relative w-full bg-[#121212] text-white overflow-hidden">
      
      {/* RECOMMENDED IMAGE SIZES:
        - Desktop: 1920x1080px (Focus the main product on the right side of the image)
        - Mobile:  1080x1350px (Focus the main product in the top center of the image)
        Place these in your public/hero/ folder.
      */}

      {/* Desktop Image Background */}
      <div className="hidden lg:block absolute inset-0 w-full h-full">
        <Image
          src="/hero/1.jpg"
          alt="Ferixo Premium Build Quality"
          fill
          className="object-cover object-right"
        />
        {/* Horizontal Cinematic Fade (Solid dark on left, fading to transparent on right) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/80 to-transparent"></div>
      </div>

      {/* Mobile Image Background */}
      <div className="block lg:hidden absolute top-0 left-0 w-full h-[60vh]">
        <Image
          src="/features/2.jpg"
          alt="Ferixo Premium Build Quality"
          fill
          className="object-cover object-top"
        />
        {/* Vertical Cinematic Fade (Solid dark on bottom, fading to transparent on top) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent"></div>
      </div>

      {/* Content Container - Increased padding for mobile (px-8 sm:px-10) */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-10 lg:px-8 py-20 lg:py-32">
        <div className="w-full lg:w-1/2 pt-[35vh] lg:pt-0">
          
          {/* Decreased mobile heading text size (text-2xl) */}
          <h2 className="text-2xl lg:text-5xl font-black tracking-tight mb-4">
            Engineered for <br/> <span className="text-brand-blue">Absolute Perfection.</span>
          </h2>
          <p className="text-gray-400 text-base lg:text-lg mb-10 lg:mb-12 max-w-md font-medium">
            Every Ferixo product is a masterclass in material science and minimalist design. 
          </p>

          <div className="space-y-6 lg:space-y-8">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-4 lg:gap-5 group">
                  
                  {/* Increased mobile icon size (w-14/h-14 on mobile, w-12/h-12 on desktop) */}
                  <div className="flex-shrink-0 w-14 h-14 lg:w-12 lg:h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-brand-blue group-hover:bg-brand-blue/10 transition-colors">
                    <Icon className="w-7 h-7 lg:w-6 lg:h-6 text-gray-300 group-hover:text-brand-blue transition-colors" />
                  </div>
                  
                  <div className="pt-1 lg:pt-0">
                    {/* Decreased mobile text size for titles and descriptions */}
                    <h3 className="text-lg lg:text-xl font-bold text-gray-100 leading-tight mb-1">{item.title}</h3>
                    <p className="text-xs lg:text-sm text-gray-400 font-medium leading-relaxed max-w-sm">
                      {item.desc}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}