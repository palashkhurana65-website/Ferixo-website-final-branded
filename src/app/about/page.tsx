import Link from "next/link";
import { Thermometer, ShieldCheck, Droplet, ArrowRight, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="pb-32">
      {/* HERO SECTION */}
      <div className="bg-white border-b border-gray-100 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tighter mb-6">
            Engineering the <span className="text-brand-blue">Perfect Sip.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed">
            Born in Ludhiana, Punjab, Ferixo was built on a simple obsession: to create premium, indestructible drinkware that refuses to compromise on temperature, design, or utility.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
        
        {/* OUR STORY: Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
          <div className="order-2 lg:order-1 space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-primary tracking-tight">The End of Compromise</h2>
            <p className="text-gray-500 font-medium leading-relaxed text-lg">
              We were tired of lukewarm coffee during early morning commutes and watered-down iced drinks in the summer heat. We realized that standard bottles simply weren't engineered to keep up with the demands of a modern, fast-paced life.
            </p>
            <p className="text-gray-500 font-medium leading-relaxed text-lg">
              That frustration sparked the creation of Ferixo. We spent months sourcing the highest-grade 18/8 stainless steel and perfecting our double-wall vacuum insulation technology to ensure that when you pour something in, it stays exactly how you intended.
            </p>
          </div>
          <div className="order-1 lg:order-2">
            <div className="aspect-square md:aspect-[4/3] bg-white border border-gray-100 rounded-[2.5rem] p-8 flex items-center justify-center shadow-sm relative overflow-hidden group">
               {/* Decorative Element representing engineering / blueprint */}
               <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(#004de7_1px,transparent_1px),linear-gradient(90deg,#004de7_1px,transparent_1px)] bg-[size:20px_20px]"></div>
               <div className="relative z-10 w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center animate-[spin_20s_linear_infinite]">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-brand-blue flex items-center justify-center">
                    <Target size={40} className="text-brand-blue" />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* CORE VALUES / ENGINEERING */}
        <div className="mb-24">
          <h2 className="text-3xl font-black text-primary text-center mb-12">The Ferixo Standard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mb-6">
                <Thermometer size={28} />
              </div>
              <h3 className="text-xl font-black text-primary mb-3">Thermal Lock Technology</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Double-wall vacuum insulation eliminates temperature transfer, keeping your drinks icy cold for 24 hours or piping hot for 12 hours.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-gray-50 text-gray-700 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-black text-primary mb-3">Pro-Grade Durability</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Crafted from 18/8 kitchen-grade stainless steel. It is puncture-resistant, rust-proof, and finished with a sweat-free premium matte coating.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mb-6">
                <Droplet size={28} />
              </div>
              <h3 className="text-xl font-black text-primary mb-3">Pure Taste Guarantee</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                100% BPA-free and non-toxic materials ensure that there is no metallic aftertaste or flavor transfer from your previous drinks.
              </p>
            </div>

          </div>
        </div>

        {/* CALL TO ACTION */}
        <div className="bg-primary rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-blue/30 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-6">Ready to upgrade your gear?</h2>
            <p className="text-gray-400 font-medium text-lg mb-10 max-w-xl mx-auto">
              Join thousands of professionals and adventurers who trust Ferixo for their daily hydration.
            </p>
            <Link href="/shop/all" className="inline-flex items-center gap-2 bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-600 transition-all shadow-xl shadow-brand-blue/20 active:scale-95">
              Explore the Collection <ArrowRight size={20} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}